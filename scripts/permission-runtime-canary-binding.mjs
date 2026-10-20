import {realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {runtimeReporterContext} from './permission-runtime-results.mjs';

// The runtime report is part of the canary scan, never a second output channel.
export function tc18ReporterArguments(root,env=process.env,sourceRoot=process.cwd()){
  if(!env.PERMISSION_RUNTIME_CONTEXT)return [];
  const c=runtimeReporterContext(env);
  if(c.stage!=='pin-tc18-wrapper'||c.runner!=='playwright'||c.outputRoot!==realpathSync(resolve(root))
    ||c.sourceRoot!==realpathSync(resolve(sourceRoot)))throw Error('PIN_CANARY_RUNTIME_BOUNDARY_REFUSED');
  return ['--reporter','./scripts/permission-pin-canary-reporter.mjs,./scripts/permission-runtime-playwright-reporter.mjs'];
}
