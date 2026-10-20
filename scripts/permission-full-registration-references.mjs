// Runtime reference roles and lexical identities only. Never evaluate source.
// All walks, scope entries and queries share the analyzer's structural budget.
export function runtimeReferences(ts, sourceFile, {tick, demand, limit, valueBytes}) {
  const children = new WeakMap(), reads = new WeakMap(), bindings = new WeakMap();
  const variables = new Map(), functions = new Map(), imports = [];
  let bindingCount = 0;
  const scope = (parent, functionScope = false) => ({parent, functionScope, names: new Map()});
  const root = scope(null, true);
  function bind(id, s, reuse = false) {
    if (!id || !ts.isIdentifier(id)) return;
    tick();
    if (reuse && s.names.has(id.text)) { bindings.set(id, s.names.get(id.text)); return; }
    demand(++bindingCount <= limit, 'BOUND');
    valueBytes(Buffer.byteLength(id.text) + 8);
    // Duplicate lexical declarations are not an admitted registration domain.
    demand(!s.names.has(id.text), 'BOUND');
    s.names.set(id.text, id);
    bindings.set(id, id);
  }
  function variableScope(s) { for (; !s.functionScope; s = s.parent) tick(); return s; }
  function visit(n, s, depth = 0, role = 'value', owner = null) {
    if (!n) return;
    tick(depth);
    if (role === 'type' || ts.isTypeNode(n) || ts.isTypeAliasDeclaration(n) || ts.isInterfaceDeclaration(n)) return;
    if (owner) children.get(owner).push(n);
    children.set(n, []);
    const child = (v, r = 'value', sc = s) => visit(v, sc, depth + 1, r, n);
    const list = (vs, r = 'value', sc = s) => { for (const v of vs ?? []) child(v, r, sc); };
    const name = (v, sc = s) => { if (v && ts.isComputedPropertyName(v)) child(v.expression, 'value', sc); };
    const pattern = (v, sc, reuse = false, d = depth + 1) => {
      if (!v) return;
      tick(d);
      if (ts.isIdentifier(v)) { bind(v, sc, reuse); return; }
      for (const e of v.elements ?? []) {
        tick(d);
        if (ts.isOmittedExpression(e)) continue;
        if (e.propertyName && ts.isComputedPropertyName(e.propertyName)) visit(e.propertyName.expression, sc, d + 1, 'value', n);
        pattern(e.name, sc, reuse, d + 1);
        visit(e.initializer, sc, d + 1, 'value', n);
      }
    };
    if (ts.isIdentifier(n)) { reads.set(n, s); return; }
    if (ts.isAsExpression(n) || ts.isSatisfiesExpression(n) || ts.isTypeAssertionExpression(n) || ts.isNonNullExpression(n)) { child(n.expression); return; }
    if (ts.isImportDeclaration(n)) {
      const c = n.importClause;
      if (c && !c.isTypeOnly) {
        if (c.name) { bind(c.name, s); imports.push(c.name); }
        if (c.namedBindings && ts.isNamespaceImport(c.namedBindings)) { bind(c.namedBindings.name, s); imports.push(c.namedBindings.name); }
        else for (const e of c?.namedBindings?.elements ?? []) if (!e.isTypeOnly) { bind(e.name, s); imports.push(e.name); }
      }
      return;
    }
    if (ts.isVariableDeclaration(n)) {
      const sc = n.parent.flags & ts.NodeFlags.BlockScoped ? s : variableScope(s);
      pattern(n.name, sc, !(n.parent.flags & ts.NodeFlags.BlockScoped));
      if (ts.isIdentifier(n.name)) variables.set(bindings.get(n.name), {node: n, constant: Boolean(n.parent.flags & ts.NodeFlags.Const)});
      child(n.initializer);
      return;
    }
    if (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n) || ts.isGetAccessorDeclaration(n) || ts.isSetAccessorDeclaration(n) || ts.isConstructorDeclaration(n)) {
      const fnScope = scope(s, true);
      if (ts.isFunctionDeclaration(n) && n.name) { bind(n.name, s); functions.set(n.name, n); }
      else if (ts.isFunctionExpression(n) && n.name) bind(n.name, fnScope);
      else name(n.name);
      // Parameter defaults execute within the parameter scope; body declarations
      // must not shadow their outer reads. Bodies get a separate lexical scope.
      for (const p of n.parameters) { pattern(p.name, fnScope); child(p.initializer, 'value', fnScope); }
      child(n.body, 'value', scope(fnScope, true));
      return;
    }
    if (ts.isBlock(n) || ts.isModuleBlock(n) || ts.isCaseBlock(n)) {
      const blockScope = scope(s);
      ts.forEachChild(n, v => { child(v, 'value', blockScope); });
      return;
    }
    if (ts.isForOfStatement(n) || ts.isForInStatement(n) || ts.isForStatement(n)) {
      const loopScope = scope(s);
      child(n.initializer, 'value', loopScope);
      child(n.expression, 'value', loopScope);
      child(n.condition, 'value', loopScope);
      child(n.incrementor, 'value', loopScope);
      child(n.statement, 'value', loopScope);
      return;
    }
    if (ts.isCatchClause(n)) {
      const catchScope = scope(s);
      if (n.variableDeclaration) pattern(n.variableDeclaration.name, catchScope);
      child(n.block, 'value', catchScope);
      return;
    }
    if (ts.isPropertyAccessExpression(n)) { child(n.expression); return; }
    if (ts.isPropertyAssignment(n)) { name(n.name); child(n.initializer); return; }
    if (ts.isShorthandPropertyAssignment(n)) { child(n.name); child(n.objectAssignmentInitializer); return; }
    if (ts.isPropertyDeclaration(n)) { name(n.name); child(n.initializer); return; }
    if (ts.isClassDeclaration(n) || ts.isClassExpression(n)) {
      if (ts.isClassDeclaration(n) && n.name) bind(n.name, s);
      const classScope = scope(s);
      if (ts.isClassExpression(n) && n.name) bind(n.name, classScope);
      for (const h of n.heritageClauses ?? []) if (h.token === ts.SyntaxKind.ExtendsKeyword) for (const t of h.types) child(t.expression);
      list(n.members, 'value', classScope);
      list(n.modifiers?.filter(m => m.kind === ts.SyntaxKind.Decorator));
      return;
    }
    if (ts.isLabeledStatement(n)) { child(n.statement); return; }
    if (ts.isBreakStatement(n) || ts.isContinueStatement(n)) return;
    if (ts.isEnumDeclaration(n)) {
      bind(n.name, s);
      for (const m of n.members) { name(m.name); child(m.initializer); }
      return;
    }
    if (ts.isModuleDeclaration(n)) { if (ts.isIdentifier(n.name)) bind(n.name, s); child(n.body, 'value', scope(s)); return; }
    // Unhandled runtime syntax remains visible, never silently pure. Type
    // children are erased by the entry check; identifiers are reads by default.
    ts.forEachChild(n, v => { child(v); });
  }
  visit(sourceFile, root);
  function key(id) {
    tick();
    if (bindings.has(id)) return bindings.get(id);
    let s = reads.get(id);
    for (; s; s = s.parent) { tick(); if (s.names.has(id.text)) return s.names.get(id.text); }
    return id.text; // Only genuinely unbound names share a global identity.
  }
  function identifiers(n, target, depth = 0) {
    if (!n) return;
    tick(depth);
    if (reads.has(n)) target.add(key(n));
    for (const c of children.get(n) ?? []) identifiers(c, target, depth + 1);
  }
  function references(n, target, depth = 0) {
    if (!n) return false;
    tick(depth);
    if (reads.has(n) && target.has(key(n))) return true;
    for (const c of children.get(n) ?? []) if (references(c, target, depth + 1)) return true;
    return false;
  }
  const forEachChild = (n, cb) => { for (const c of children.get(n) ?? []) cb(c); };
  return {key, identifiers, references, forEachChild, variables, functions, imports};
}
