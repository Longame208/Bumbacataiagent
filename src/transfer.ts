import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';

dotenv.config();

export async function transferTokens(): Promise<string> {
    // Connect to Solana network (use 'devnet-beta' for production)
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Load sender's wallet from private key
    const privateKey = bs58.decode(process.env.WALLET_PRIVATE_KEY);
    const senderKeypair = Keypair.fromSecretKey(privateKey);

    // Token mint address
    const mintAddress = new PublicKey('hcVMgnBLLomFLfdNhHNh68eC76Xsg2Qagu3qcrwuri3');

    // Recipient address
    if (!process.env.RECIPIENT_ADDRESS) {
        throw new Error('Recipient address not found in environment variables');
    }
    const recipientAddress = new PublicKey(process.env.RECIPIENT_ADDRESS);

    try {
        // Get or create sender's token account
        const senderATA = await splToken.getOrCreateAssociatedTokenAccount(
            connection,
            senderKeypair,
            mintAddress,
            senderKeypair.publicKey
        );

        // Get or create recipient's token account
        const recipientATA = await splToken.getOrCreateAssociatedTokenAccount(
            connection,
            senderKeypair,
            mintAddress,
            recipientAddress
        );

        // Get mint info for decimals
        const mint = await splToken.getMint(connection, mintAddress);
        const transferAmount = 100 * Math.pow(10, mint.decimals);

        // Send tokens
        console.log('Initiating transfer...');
        const transaction = await splToken.transfer(
            connection,
            senderKeypair,
            senderATA.address,
            recipientATA.address,
            senderKeypair.publicKey,
            transferAmount
        );

        console.log('Transfer successful! Transaction signature:', transaction);
        
        return transaction;
    } catch (error) {
        console.error('Error during transfer:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}