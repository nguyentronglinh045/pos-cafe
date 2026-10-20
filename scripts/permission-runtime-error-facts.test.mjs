import test from'node:test';import assert from'node:assert/strict';
import{runtimeErrorFacts,safeRuntimeErrorFacts,runtimeErrorLine,runtimeErrorLocation,RUNTIME_ERROR_FILES}from'./permission-runtime-error-facts.mjs';
test('runtime error projection keeps only known code/name/matcher ordinals, never private exception fields',()=>{
 const a=runtimeErrorFacts({name:'AssertionError',code:'23505',message:'SECRET',query:'SECRET',stack:'SECRET',
  matcherResult:{name:'toBe',actual:'SECRET',expected:'SECRET'}});
 assert(a.errorCodeOrdinal>0);assert.equal(a.errorNameOrdinal,4);assert.equal(a.errorMatcherOrdinal,1);
 assert.equal(JSON.stringify(a).includes('SECRET'),false);assert.deepEqual(safeRuntimeErrorFacts(a),a);
 assert.deepEqual(runtimeErrorFacts({name:'SECRET',code:'SECRET',matcherResult:{name:'SECRET'}}),{errorCodeOrdinal:0,errorNameOrdinal:0,errorMatcherOrdinal:0});
 for(const delta of[{raw:'SECRET'},{errorCodeOrdinal:99},{errorNameOrdinal:-1},{errorMatcherOrdinal:1.1}])assert.equal(safeRuntimeErrorFacts({...a,...delta}),null);
});
test('hook origin only projects a fixed source-file ordinal and line, including Windows paths',()=>{
 const root='/owned/source',file=root+'/'+RUNTIME_ERROR_FILES[0];
 assert.deepEqual(runtimeErrorLocation({stack:'Error: SECRET\n    at setup ('+file+':41:9)'},root),{fileOrdinal:1,line:41});
 assert.deepEqual(runtimeErrorLocation({stack:'Error\n    at D:\\owned\\source\\'+RUNTIME_ERROR_FILES[0].replaceAll('/','\\')+':99:1'},'D:\\owned\\source'),{fileOrdinal:1,line:99});
 for(const stack of['SECRET','Error\n    at /other/source/'+RUNTIME_ERROR_FILES[0]+':41:9','Error\n    at '+file+':100001:1'])
  assert.deepEqual(runtimeErrorLocation({stack},root),{fileOrdinal:0,line:0});
});
test('failure location projects only a bounded line from the exact current test file, never another path or stack payload',()=>{
 const file='/owned/tests/example[1].test.ts';
 assert.equal(runtimeErrorLine({stack:'SECRET\n    at test ('+file+':184:22)'},file),184);
 assert.equal(runtimeErrorLine({stack:'Error\n    at file://'+file+':99:1'},file),99);
 assert.equal(runtimeErrorLine({stack:'Error\n    at D:\\owned\\tests\\test.ts:123:2'},'D:\\owned\\tests\\test.ts'),123);
 assert.equal(runtimeErrorLine({stack:'AssertionError: '+file+':42:1\n    at test ('+file+':184:22)'},file),184);
 for(const stack of['SECRET','AssertionError: '+file+':42:1','Error\n"    at '+file+':42:1"',
  'Error\n    at /other/tests/example[1].test.ts:1:1','Error\n    at '+file+':0:1','Error\n    at '+file+':100001:1','Error\n    at '+file+':184:1'+'x'.repeat(65536)])
  assert.equal(runtimeErrorLine({stack},file),0);
});
