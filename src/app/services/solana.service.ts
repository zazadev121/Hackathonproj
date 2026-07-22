import { Injectable, signal } from '@angular/core';
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export class SolanaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SolanaError';
  }
}

@Injectable({ providedIn: 'root' })
export class SolanaService {
  readonly walletAddress = signal<string | null>(null);
  readonly devnetBalance = signal<number | null>(null);
  readonly isConnecting = signal(false);
  readonly isMinting = signal(false);
  readonly isCheckingBalance = signal(false);

  private connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  isPhantomInstalled(): boolean {
    return !!window.solana?.isPhantom;
  }

  async connectWallet(): Promise<string> {
    if (!this.isPhantomInstalled()) {
      throw new SolanaError('Phantom wallet is not installed. Install it from phantom.app.');
    }

    this.isConnecting.set(true);
    try {
      const result = await window.solana!.connect({ onlyIfTrusted: false });
      const address = result.publicKey.toBase58();
      this.walletAddress.set(address);
      await this.refreshBalance();
      return address;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
        throw new SolanaError('Wallet connection was rejected.');
      }
      throw new SolanaError(`Could not connect wallet: ${msg}`);
    } finally {
      this.isConnecting.set(false);
    }
  }

  async refreshBalance(): Promise<number | null> {
    const provider = window.solana;
    if (!provider?.publicKey) {
      this.devnetBalance.set(null);
      return null;
    }

    this.isCheckingBalance.set(true);
    try {
      const lamports = await this.connection.getBalance(provider.publicKey);
      const sol = lamports / LAMPORTS_PER_SOL;
      this.devnetBalance.set(sol);
      return sol;
    } catch {
      this.devnetBalance.set(null);
      return null;
    } finally {
      this.isCheckingBalance.set(false);
    }
  }

  hasEnoughDevnetSol(): boolean {
    const balance = this.devnetBalance();
    return balance !== null && balance >= 0.001;
  }

  async mintProofOfMastery(topic: string, finalScore: number): Promise<string> {
    if (!this.isPhantomInstalled()) {
      throw new SolanaError('Phantom wallet is not installed.');
    }

    const provider = window.solana!;
    if (!provider.publicKey) {
      throw new SolanaError('Wallet not connected. Connect Phantom first.');
    }

    const balance = await this.refreshBalance();
    if (balance !== null && balance < 0.001) {
      throw new SolanaError(
        'Insufficient devnet SOL. Switch Phantom to Devnet, then get free SOL at faucet.solana.com.'
      );
    }

    this.isMinting.set(true);
    try {
      const memoPayload = JSON.stringify({
        topic,
        final_score: finalScore,
        timestamp: Date.now(),
      });
      const memoBytes = new TextEncoder().encode(memoPayload);

      const instruction = new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [
          {
            pubkey: provider.publicKey!,
            isSigner: true,
            isWritable: true,
          },
        ],
        // Uint8Array works at runtime; web3.js types expect Node Buffer
        data: memoBytes as never,
      });

      const transaction = new Transaction().add(instruction);
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.publicKey!;

      const { signature } = await provider.signAndSendTransaction(transaction, {
        skipPreflight: false,
      });

      await this.connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
      );

      return signature;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('insufficient')) {
        throw new SolanaError(
          'Insufficient devnet SOL. Get free SOL at faucet.solana.com and try again.'
        );
      }
      if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
        throw new SolanaError('Transaction was rejected in Phantom.');
      }
      throw new SolanaError(`Mint failed: ${msg}`);
    } finally {
      this.isMinting.set(false);
    }
  }

  getExplorerUrl(signature: string): string {
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  }
}
