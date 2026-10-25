import{posix}from'node:path';
export const PIN_UI_ACTION_SHA='cf430e030ddbb5b0abf93d22962f4752f3646cd9';
export function pinUiActionRoot(root){
 if(typeof root!=='string'||!root.startsWith('/')||posix.resolve(root)!==root||/[\r\n\0\\]/.test(root)||!root.endsWith('/pos-cafe/pos-cafe'))throw Error('PIN_UI_ACTION_ROOT_REFUSED');
 return posix.resolve(root,'../..','_actions/actions/upload-artifact',PIN_UI_ACTION_SHA);
}
