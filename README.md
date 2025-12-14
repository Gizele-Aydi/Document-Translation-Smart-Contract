# Document-Translation-Smart-Contract
npm install
npm run dev


---

## 1️⃣ Start Fresh Network

```bash
cd /mnt/c/Users/LENOVO/Downloads/senior/Document-Translation-Smart-Contract/fabric/fabric-samples/test-network

# Shut down any previous network (if running)
./network.sh down

# Start network and create channel
./network.sh up createChannel
```

---

## 2️⃣ Package Chaincode

```bash
peer lifecycle chaincode package doctrans.tar.gz \
  --path ../chaincode/document-translation \
  --lang node \
  --label doctrans_1.4
```

---

## 3️⃣ Install Chaincode on Peers

### Org1

```bash
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode install doctrans.tar.gz
```

### Org2

```bash
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode install doctrans.tar.gz
```

---

## 4️⃣ Query Installed Chaincode

```bash
peer lifecycle chaincode queryinstalled
```

* Copy the `PACKAGE_ID` for `doctrans_1.4` and set it:

```bash
export CC_PACKAGE_ID=doctrans_1.4:YOUR_ACTUAL_PACKAGE_ID
```

---

## 5️⃣ Approve Chaincode for Each Org

### Org2

```bash
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name doctrans \
  --version 1.4 \
  --package-id $CC_PACKAGE_ID \
  --sequence 1 \
  --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

### Org1

```bash
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name doctrans \
  --version 1.4 \
  --package-id $CC_PACKAGE_ID \
  --sequence 1 \
  --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

---

## 6️⃣ Commit Chaincode

```bash
peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name doctrans \
  --version 1.4 \
  --sequence 1 \
  --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
```

---

## 7️⃣ Test the Chaincode

### Invoke: Register a Document

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C mychannel \
  -n doctrans \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
  -c '{"function":"DocumentTranslationContract:registerDocument","Args":["DOC005","USER001","University of Tunis","Diploma","{}"]}'
```

### Query: Read the Registered Document

```bash
peer chaincode query \
  -C mychannel \
  -n doctrans \
  -c '{"function":"DocumentTranslationContract:getDocument","Args":["DOC005"]}'
```

> ⚠️ Make sure the function name `getDocument` matches your contract. If your contract uses a different function name to read a document, replace it accordingly.

---

## 8️⃣ Notes

* The **contract prefix** (`DocumentTranslationContract:`) is required if your chaincode contains multiple contracts.
* Always check the **function names** in your chaincode to avoid `function does not exist` errors.
* The commands assume **TLS is enabled**. Adjust `--tls` and `--cafile` options if using a non-TLS network.

