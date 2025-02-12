const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // 加载连接配置文件
        const ccpPath = path.resolve(__dirname, '../../connection-profile.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // 创建新的 CA 客户端
        const caInfo = ccp.certificateAuthorities['ca.producers.agritrace.com'];
        const caTLSCACerts = caInfo.tlsCACerts.path;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: fs.readFileSync(caTLSCACerts), verify: false }, caInfo.caName);

        // 创建钱包
        const walletPath = path.join(__dirname, '../../wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // 检查管理员是否已存在
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // 注册并登记管理员用户
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'ProducersMSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

main(); 