export*from'./permission-ci1-intake.mjs';
import{ci1WorkerLayout as baseLayout}from'./permission-ci1-intake.mjs';
import{CI1_PROJECT}from'./permission-runtime-service-policy.mjs';
export function ci1WorkerLayout(run,attempt){return{...baseLayout(run,attempt),edgeVolume:'supabase_edge_runtime_'+CI1_PROJECT};}
