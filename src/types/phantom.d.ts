import { PublicKey } from '@solana/web3.js';

export {};

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      publicKey: PublicKey | null;
      connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PublicKey }>;
      disconnect(): Promise<void>;
      signAndSendTransaction(
        transaction: import('@solana/web3.js').Transaction,
        options?: { skipPreflight?: boolean }
      ): Promise<{ signature: string }>;
    };
  }
}
