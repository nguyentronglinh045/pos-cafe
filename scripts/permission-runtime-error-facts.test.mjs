import test from'node:test';import assert from'node:assert/strict';
import{runtimeErrorFacts,safeRuntimeErrorFacts}from'./permission-runtime-error-facts.mjs';
test('runtime error projection keeps only known code/name/matcher ordinals, never private exception fields',()=>{
 const a=runtimeErrorFacts({name:'AssertionError',code:'23505',message:'SECRET',query:'SECRET',stack:'SECRET',
  matcherResult:{name:'toBe',actual:'SECRET',expected:'SECRET'}});
 assert(a.errorCodeOrdinal>0);assert.equal(a.errorNameOrdinal,4);assert.equal(a.errorMatcherOrdinal,1);
 assert.equal(JSON.stringify(a).includes('SECRET'),false);assert.deepEqual(safeRuntimeErrorFacts(a),a);
 assert.deepEqual(runtimeErrorFacts({name:'SECRET',code:'SECRET',matcherResult:{name:'SECRET'}}),{errorCodeOrdinal:0,errorNameOrdinal:0,errorMatcherOrdinal:0});
 for(const delta of[{raw:'SECRET'},{errorCodeOrdinal:99},{errorNameOrdinal:-1},{errorMatcherOrdinal:1.1}])assert.equal(safeRuntimeErrorFacts({...a,...delta}),null);
});
