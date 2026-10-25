import{data,largeData,checked,result,record,demand,str,hex,sha,freeze}from'./permission-full-d1-data.mjs';

// Trusted tooling constructor, separate from data APIs. The parse capability
// is supplied only by the audited read-only compiler loader. Application/data
// callers receive analyze(JSON text), never a compiler or arbitrary host.
export function createAstSourcePort(descriptorJson,parseFunction){
 const d=record(data(descriptorJson),['name','version','entrySha256','packageSha256','readOnlySandbox']);
 demand(d.name==='typescript'&&str(d.version)&&hex(d.entrySha256)&&hex(d.packageSha256)&&d.readOnlySandbox===true&&typeof parseFunction==='function','SOURCE');
 return Object.freeze({analyze(inputJson){return checked(()=>{const x=record(largeData(inputJson),['path','source']);demand(typeof x.path==='string'&&typeof x.source==='string','INPUT');
  const ir=parseFunction(x.path,x.source);record(ir,['edges','dynamic','diagnostics']);demand(Array.isArray(ir.edges)&&Array.isArray(ir.dynamic)&&Array.isArray(ir.diagnostics),'SOURCE');
  return result(ir.diagnostics.length?'STOP':'MATCH',{tool:d,sourceSha256:sha(x.source),...ir});
 });}});
}

// This adapter traverses the trusted compiler AST. It never calls resolve,
// emit, watch, evaluator, config imports, or a compiler filesystem host.
export function typescriptIR(ts,file,source){
 const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,/\.tsx$/i.test(file)?ts.ScriptKind.TSX:/\.jsx$/i.test(file)?ts.ScriptKind.JSX:/\.[cm]?js$/i.test(file)?ts.ScriptKind.JS:ts.ScriptKind.TS);
 const edges=[],dynamic=[];const literal=n=>n&&(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))?n.text:null;
 const variables=new Map();const findVariables=n=>{if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)){const name=n.name.text;if(variables.has(name))variables.set(name,null);else variables.set(name,n.initializer);}ts.forEachChild(n,findVariables);};findVariables(sf);
 function staticURL(n,depth=0){if(!n||depth>12)return null;if(ts.isIdentifier(n))return staticURL(variables.get(n.text),depth+1);
  if(ts.isNewExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='URL'){const spec=literal(n.arguments?.[0]);if(spec===null)return null;const base=n.arguments?.[1];let anchor;
   if(base?.getText(sf)==='import.meta.url')anchor='file:///__D_SOURCE__/'+file;else anchor=staticURL(base,depth+1);
   try{return anchor?new URL(spec,anchor).href:null;}catch{return null;}}
  return null;
 }
 const add=(node,arg,kind)=>{const specifier=literal(arg),line=sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1;
  const url=kind==='URL_ASSET'?staticURL(node):kind==='FILE_ASSET'?staticURL(arg):null;
  if(url?.startsWith('file:///__D_SOURCE__/')){edges.push({specifier:specifier??arg.getText(sf),kind,line,resolvedSourcePath:decodeURIComponent(url.slice('file:///__D_SOURCE__/'.length))});return;}
  if(specifier!==null)edges.push({specifier,kind,line,...(kind==='URL_ASSET'?{baseExpression:node.arguments?.[1]?.getText(sf)??null}:{})});else dynamic.push({kind,line,expressionKind:arg?ts.SyntaxKind[arg.kind]:'MISSING',cause:'RUNTIME_PARAMETER_OR_COMPOSED_EXPRESSION',owner:'D',action:'CLOSE_WITH_EXACT_OWNED_PARAMETER_DOMAIN_AND_SOURCE_BOUND_RESOLVER'});};
 function visit(n){
  if(ts.isImportDeclaration(n))add(n,n.moduleSpecifier,n.importClause?.isTypeOnly?'TYPE_IMPORT':'RUNTIME_IMPORT');
  else if(ts.isExportDeclaration(n)&&n.moduleSpecifier)add(n,n.moduleSpecifier,n.isTypeOnly?'TYPE_EXPORT':'RUNTIME_EXPORT');
  else if(ts.isImportTypeNode(n)){const arg=ts.isLiteralTypeNode(n.argument)?n.argument.literal:null;add(n,arg,'TYPE_IMPORT');}
  else if(ts.isCallExpression(n)){
   if(n.expression.kind===ts.SyntaxKind.ImportKeyword)add(n,n.arguments[0],'DYNAMIC_IMPORT');
   else if(ts.isIdentifier(n.expression)&&n.expression.text==='require')add(n,n.arguments[0],'REQUIRE');
   else if(ts.isIdentifier(n.expression)&&['readFileSync','readFile','readFileText'].includes(n.expression.text))add(n,n.arguments[0],'FILE_ASSET');
   else if(ts.isPropertyAccessExpression(n.expression)&&['readFileSync','readFile'].includes(n.expression.name.text))add(n,n.arguments[0],'FILE_ASSET');
  }else if(ts.isNewExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='URL')add(n,n.arguments?.[0],'URL_ASSET');
  ts.forEachChild(n,visit);
 }
 visit(sf);for(const ref of sf.referencedFiles)edges.push({specifier:ref.fileName,kind:'TYPE_REFERENCE',line:sf.getLineAndCharacterOfPosition(ref.pos).line+1});
 for(const ref of sf.typeReferenceDirectives)edges.push({specifier:ref.fileName,kind:'PACKAGE_TYPE_REFERENCE',line:sf.getLineAndCharacterOfPosition(ref.pos).line+1});
 return {edges,dynamic,diagnostics:(sf.parseDiagnostics??[]).map(e=>({code:e.code,line:sf.getLineAndCharacterOfPosition(e.start??0).line+1}))};
}
