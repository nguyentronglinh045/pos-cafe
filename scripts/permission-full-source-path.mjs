// Repository source names include legitimate internal spaces/Unicode. Evidence
// artifact paths keep their separate stricter grammar in d1-data unchanged.
export function safeSourcePath(value){return typeof value==='string'&&value.length>0&&value.length<=600&&!/[\u0000-\u001f\u007f\\<>:"|?*]/.test(value)&&!value.startsWith('/')&&value.split('/').every(part=>part&&part!=='.'&&part!=='..'&&!/[. ]$/.test(part)&&part.toLowerCase()!=='.git'&&!/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));}
