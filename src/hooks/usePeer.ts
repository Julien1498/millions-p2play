import { usePeer as useCorePeer, type PeerManagerLike } from "p2play-core";

export function usePeer(options?: { externalPeerManager?: PeerManagerLike }): ReturnType<typeof useCorePeer> {
  return useCorePeer({
    externalPeerManager: options?.externalPeerManager,
    namespacePrefix: "millions",
  });
}
