import datetime
import hashlib
import json
import os
from pathlib import Path
import queue
import re
import shutil
import subprocess
import threading
import time
import tomllib

ROOT = Path(r'D:\Workspace\pos-cafe-docs\docs\implementation-log\permission-release-20261022\mcp-staging-readonly')
CWD = r'D:\Workspace\pos-cafe'
URL = 'https://mcp.supabase.com/mcp?project_ref=ineckiashpwloncxnbqx&read_only=true&features=database,docs'
SERVER = 'supabase_pos_cafe'
QUERY = "select 1 as connection_ok, current_user as database_role, current_setting('transaction_read_only') as transaction_read_only;"
THREAD = os.environ['CODEX_THREAD_ID']
report = {'observedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'transport': 'fresh installed Codex app-server stdio client; existing thread resumed; no LLM turn',
          'projectRef': 'ineckiashpwloncxnbqx', 'mcpUrl': URL,
          'query': QUERY, 'databaseToolCalls': 0, 'originalDatabaseToolCalls': 0,
          'newThreadCreated': False, 'newModelTurnStarted': False, 'steps': []}
proc = None
messages = queue.Queue()

def consume(stream):
    for line in stream:
        try:
            messages.put(json.loads(line))
        except (ValueError, TypeError):
            pass

def rpc(method, params, seconds=30):
    ident = len(report['steps']) + 1
    report['steps'].append({'method': method, 'status': 'SENT'})
    request = {'id': ident, 'method': method, 'params': params}
    proc.stdin.write(json.dumps(request) + '\n')
    proc.stdin.flush()
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        msg = messages.get(timeout=max(0.01, end-time.monotonic()))
        if msg.get('id') == ident and ('result' in msg or 'error' in msg):
            if 'error' in msg:
                report['steps'][-1].update(status='RPC_ERROR', code=msg['error'].get('code'))
                raise RuntimeError('RPC rejected at ' + method)
            report['steps'][-1]['status'] = 'PASS'
            return msg['result']
        if 'method' in msg and 'id' in msg:
            # Never grant permission or accept an unexpected consent request.
            proc.stdin.write(json.dumps({'id': msg['id'], 'error': {'code': -32603, 'message': 'Interactive request not authorized by read-only connection probe'}}) + '\n')
            proc.stdin.flush()
            report['unexpectedInteractiveRequest'] = msg['method']
            raise RuntimeError('Unexpected interactive request')
    raise TimeoutError(method)

try:
    config = Path(CWD, '.codex', 'config.toml')
    cfg = tomllib.loads(config.read_text(encoding='utf-8-sig'))['mcp_servers']
    assert cfg[SERVER]['url'] == URL
    assert cfg['supabase']['enabled'] is False and cfg['pos_cafe_supabase_ro']['enabled'] is False
    assert 'apply_migration' in cfg[SERVER]['disabled_tools']
    assert 'apply_migration' not in cfg[SERVER]['enabled_tools']
    report['projectConfigSha256'] = hashlib.sha256(config.read_bytes()).hexdigest()
    exe = shutil.which('codex')
    inventory = subprocess.run([exe, 'mcp', 'list', '--json'], cwd=CWD, capture_output=True, text=True, timeout=30)
    assert inventory.returncode == 0
    entries = json.loads(inventory.stdout)
    base_cfg = tomllib.loads(Path(r'C:\Users\nguye\.codex\config.toml').read_text(encoding='utf-8-sig')).get('mcp_servers', {})
    # CLI discovery also includes plugin servers whose transports are not TOML entries.
    # An enabled-only CLI override for those creates an invalid standalone transport.
    standalone = {name for name, item in base_cfg.items() if 'url' in item or 'command' in item}
    standalone.update(name for name, item in cfg.items() if 'url' in item or 'command' in item)
    flags = []
    for entry in entries:
        if entry['name'] != SERVER and entry['name'] in standalone:
            flags += ['-c', 'mcp_servers.' + json.dumps(entry['name']) + '.enabled=false']
    proc = subprocess.Popen([exe, 'app-server', '--stdio'] + flags, cwd=CWD,
                            stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.DEVNULL, text=True, encoding='utf-8',
                            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    threading.Thread(target=consume, args=(proc.stdout,), daemon=True).start()
    rpc('initialize', {'clientInfo': {'name': 'staging_readonly_probe', 'version': '1.0.0'}, 'capabilities': {'experimentalApi': True}})
    proc.stdin.write(json.dumps({'method': 'initialized', 'params': {}}) + '\n')
    proc.stdin.flush()
    effective = rpc('config/read', {'cwd': CWD, 'includeLayers': False})
    actual = effective['config']['mcp_servers']
    assert actual[SERVER]['url'] == URL and actual[SERVER].get('enabled', True)
    assert not actual['supabase']['enabled'] and not actual['pos_cafe_supabase_ro']['enabled']
    report['freshClientConfigVerified'] = True
    resumed = rpc('thread/resume', {'threadId': THREAD, 'cwd': CWD}, seconds=45)
    assert resumed['thread']['id'] == THREAD
    report['existingThreadResumed'] = True
    del resumed
    status = rpc('mcpServerStatus/list', {'serverName': SERVER, 'threadId': THREAD, 'detail': 'toolsAndAuthOnly'}, seconds=45)
    # Store only sanitized discovery; raw descriptions/auth material are discarded.
    data = status.get('data', [])
    assert len(data) == 1 and data[0]['name'] == SERVER
    item = data[0]
    tools = item.get('tools', {})
    names = sorted(tools) if isinstance(tools, dict) else sorted(t.get('name', '') for t in tools)
    report['serverDiscovery'] = {'name': item['name'], 'authStatus': item.get('authStatus'), 'tools': names}
    assert 'execute_sql' in names and 'apply_migration' not in names
    assert config.read_bytes() and hashlib.sha256(config.read_bytes()).hexdigest() == report['projectConfigSha256']
    report['databaseToolCalls'] = 1
    result = rpc('mcpServer/tool/call', {'threadId': THREAD, 'server': SERVER, 'tool': 'execute_sql', 'arguments': {'query': QUERY}}, seconds=45)
    assert result.get('isError') is not True
    report['sqlResult'] = result
    # Only a constant, role, and connection setting were requested, no business data.
    rows = result.get('structuredContent')
    if isinstance(rows, dict):
        rows = rows.get('rows', rows.get('result'))
    if not isinstance(rows, list):
        rows = None
        decoder = json.JSONDecoder()
        for block in result.get('content', []):
            if block.get('type') != 'text':
                continue
            body = block.get('text', '')
            for match in re.finditer(r'\[\s*\{', body):
                try:
                    candidate, _ = decoder.raw_decode(body[match.start():])
                except ValueError:
                    continue
                if isinstance(candidate, list) and len(candidate) == 1 and isinstance(candidate[0], dict) and 'connection_ok' in candidate[0]:
                    assert rows is None, 'Ambiguous row payload'
                    rows = candidate
    assert isinstance(rows, list) and len(rows) == 1
    row = rows[0]
    assert row.get('connection_ok') == 1
    assert isinstance(row.get('database_role'), str) and row['database_role']
    report['verifiedRow'] = row
    assert row.get('transaction_read_only') == 'on'
    report['status'] = 'READ_ONLY_CONNECTION_PROBE_PASS'
except Exception as exc:
    report['status'] = 'PROBE_STOPPED'
    report['errorType'] = type(exc).__name__
    # Exclude raw RPC errors and tokens from evidence.
finally:
    if proc is not None:
        proc.stdin.close()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)
        report['sidecarProcessExitCode'] = proc.returncode
    report['finishedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    dest = ROOT / 'staging-connection-probe02.json'
    assert not dest.exists(), 'Keep prior receipt; no overwrite/retry'
    dest.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2), flush=True)
