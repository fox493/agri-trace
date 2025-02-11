const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

class FabricClient {
    constructor() {
        this.gateway = new Gateway();
        this.network = null;
        this.contract = null;
    }

    async init() {
        try {
            // load the network configuration
            const ccpPath = path.resolve(__dirname, '../../connection-profile.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await Wallets.newFileSystemWallet(walletPath);

            // Check to see if we've already enrolled the admin user.
            const identity = await wallet.get('admin');
            if (!identity) {
                throw new Error('Admin identity not found in wallet');
            }

            // Create a new gateway for connecting to our peer node.
            await this.gateway.connect(ccp, {
                wallet,
                identity: 'admin',
                discovery: { enabled: true, asLocalhost: true }
            });

            // Get the network (channel) our contract is deployed to.
            this.network = await this.gateway.getNetwork(process.env.FABRIC_CHANNEL_NAME);

            // Get the contract from the network.
            this.contract = this.network.getContract(process.env.FABRIC_CHAINCODE_NAME);

            console.log('Successfully connected to Fabric network');
        } catch (error) {
            console.error('Failed to connect to Fabric network:', error);
            throw error;
        }
    }

    async disconnect() {
        this.gateway.disconnect();
    }

    // Add product to the ledger
    async addProduct(product) {
        try {
            await this.contract.submitTransaction('addProduct', JSON.stringify(product));
            return { success: true };
        } catch (error) {
            console.error('Failed to add product:', error);
            throw error;
        }
    }

    // Query product by ID
    async queryProduct(productId) {
        try {
            const result = await this.contract.evaluateTransaction('queryProduct', productId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query product:', error);
            throw error;
        }
    }

    // Update product status
    async updateProductStatus(productId, status) {
        try {
            await this.contract.submitTransaction('updateProductStatus', productId, status);
            return { success: true };
        } catch (error) {
            console.error('Failed to update product status:', error);
            throw error;
        }
    }

    // Query product history
    async queryProductHistory(productId) {
        try {
            const result = await this.contract.evaluateTransaction('getProductHistory', productId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query product history:', error);
            throw error;
        }
    }

    // Query all products
    async queryAllProducts() {
        try {
            const result = await this.contract.evaluateTransaction('queryAllProducts');
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query all products:', error);
            throw error;
        }
    }
}

module.exports = new FabricClient(); 