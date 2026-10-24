import test from 'node:test';import assert from 'node:assert/strict';
import { permissionOperatorFailure, attachPermissionOperatorMessage } from './permission-operator-error.mjs';
test('known release and activation errors preserve code/identity while emitting only independent fixed operator sentences',()=>{
 const rows = [
  [
    "RELEASE_TARGET_NOT_EMPTY",
    "Đích phát hành còn dữ liệu quán. Đã dừng kích hoạt."
  ],
  [
    "TARGET_STORE_SET_MISMATCH",
    "Dữ liệu đích đã thay đổi. Đã dừng kích hoạt."
  ],
  [
    "TARGET_TENANT_SCHEMA_MISMATCH",
    "Lược đồ dữ liệu quán đã thay đổi. Đã dừng để rà soát."
  ],
  [
    "ACTIVATION_TARGET_NOT_EMPTY",
    "Đích phát hành còn dữ liệu quán. Đã dừng kích hoạt."
  ],
  [
    "ACTIVATION_STORE_SET_MISMATCH",
    "Dữ liệu đích đã thay đổi. Đã dừng kích hoạt."
  ],
  [
    "ACTIVATION_TENANT_SCHEMA_MISMATCH",
    "Lược đồ dữ liệu quán đã thay đổi. Đã dừng để rà soát."
  ],
  [
    "INVALID_TARGET_CONFIG",
    "Cấu hình đích phát hành không hợp lệ."
  ]
];
 for (const [code, message] of rows) {const e=Object.assign(new Error('PRIVATE'), {code,query:'PRIVATE',actual:'PRIVATE'});
  assert.equal(attachPermissionOperatorMessage(e,code),e);assert.equal(e.message,'PRIVATE');assert.equal(e.code,code);assert.equal(e.operatorMessage,message);
  assert.deepEqual(permissionOperatorFailure(code),{status:'BLOCKED',code,operatorMessage:message});assert(!JSON.stringify(permissionOperatorFailure(code)).includes('PRIVATE'));}
});
test('unknown/prototype/nonstring error codes cannot turn raw exception text into an operator message',()=>{
 for(const code of ['PRIVATE','__proto__','constructor',null,{},['INVALID_TARGET_CONFIG']]) {
  assert.equal(permissionOperatorFailure(code),null);const e=attachPermissionOperatorMessage(new Error('PRIVATE'),code);assert(!Object.hasOwn(e,'operatorMessage'));}
 assert.throws(()=>attachPermissionOperatorMessage({message:'PRIVATE'},'INVALID_TARGET_CONFIG'));
});
