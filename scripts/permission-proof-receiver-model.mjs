import { verifyCustodyAck } from './permission-full-custody.mjs';
import { ModelRefusal, checkBlob, checkExpectation, checkMembers, compareMembers, decode,
  integer, modelTransport, refuse, result, same, shape } from './permission-proof-transport-model.mjs';

export const RECEIVER_MODEL_VERSION = 'permission-receiver-model-v1';

/**
 * Proposed receive/open descriptor interface. Arguments are JSON text only.
 * request = {schemaVersion,packageJson,receipt,openedArchive,openedMembers,ackResponse,now}
 * receipt = {artifactId,sourceSha,cipherSha256,cipherBytes,receivedBytes,complete}
 * openedArchive is a BlobDescriptor; openedMembers are MemberDescriptor[].
 * ackResponse preserves the source567 pure ACK protocol (never POSTs a status).
 * A successful simulation never grants custody, cleanup or execution admission.
 */
export function modelReceiver(requestJson, expectedJson) {
  try {
    const { expected, members, plaintextBytes } = checkExpectation(expectedJson);
    const request = decode(requestJson, 'request');
    shape(request, ['schemaVersion', 'packageJson', 'receipt', 'openedArchive', 'openedMembers', 'ackResponse', 'now'], 'request');
    same(request.schemaVersion, 'permission-receiver-request-v1', 'SCHEMA_MISMATCH', 'request.schemaVersion');
    const transport = modelTransport(request.packageJson, expectedJson);
    if (!transport.simulationAccepted) refuse(transport.errors[0].code, transport.errors[0].field);
    const { binding } = expected;
    shape(request.receipt, ['artifactId', 'sourceSha', 'cipherSha256', 'cipherBytes', 'receivedBytes', 'complete'], 'receipt');
    if (request.receipt.complete !== true) refuse('RECEIVE_INCOMPLETE', 'receipt.complete');
    for (const field of ['artifactId', 'sourceSha', 'cipherSha256', 'cipherBytes']) same(request.receipt[field], binding[field], 'RECEIVE_MISMATCH', `receipt.${field}`);
    integer(request.receipt.receivedBytes, 'receipt.receivedBytes');
    if (request.receipt.receivedBytes < binding.cipherBytes) refuse('TRUNCATED_INPUT', 'receipt.receivedBytes');
    same(request.receipt.receivedBytes, binding.cipherBytes, 'SIZE_MISMATCH', 'receipt.receivedBytes');
    checkBlob(request.openedArchive, binding.archiveSha256, expected.archiveBytes, 'openedArchive');
    const opened = checkMembers(request.openedMembers, true, 'openedMembers');
    compareMembers(opened.members, members);
    same(opened.bytes, plaintextBytes, 'CLOSURE_MISMATCH', 'openedMembers');
    // Restrict JSON descriptor shape before the original pure verifier reads it.
    shape(request.ackResponse, ['repositoryId', 'queriedSha', 'complete', 'statuses'], 'ackResponse');
    if (!Array.isArray(request.ackResponse.statuses)) refuse('SCHEMA_MISMATCH', 'ackResponse.statuses');
    for (const status of request.ackResponse.statuses) {
      shape(status, ['id', 'context', 'state', 'description', 'target_url', 'created_at', 'creator'], 'ackResponse.status');
      shape(status.creator, ['id', 'type'], 'ackResponse.status.creator');
    }
    const ack = verifyCustodyAck(binding, request.ackResponse, { now: request.now });
    if (!ack.valid) return { ...result(RECEIVER_MODEL_VERSION, false, new ModelRefusal('ACK_REFUSED', 'ackResponse')), ackReason: ack.reason };
    return result(RECEIVER_MODEL_VERSION, true, null, {
      receive: transport.descriptors.receive, open: transport.descriptors.open, closure: transport.descriptors.closure,
      simulatedAck: { accepted: true, commitment: ack.commitment, statusId: ack.statusId,
        provenance: 'UNAUTHENTICATED_SYNTHETIC_JSON', custodyObserved: 'NOT_RUN' },
      placement: { privateCRequiredForActualPlaintext: true, actualPath: null, allocation: null, reason: 'UNKNOWN' },
    });
  } catch (error) {
    if (!(error instanceof ModelRefusal)) throw error;
    return result(RECEIVER_MODEL_VERSION, false, error);
  }
}
