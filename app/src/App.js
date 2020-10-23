import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Button, Card, Col, Form, Container, Row } from "react-bootstrap";
import './App.css';
import Biconomy from "@biconomy/mexa";
import { NotificationContainer, NotificationManager } from 'react-notifications';
const { config } = require("./config");
//import PlantManager from "./contracts/PlantManager.json";

const showErrorMessage = message => {
  NotificationManager.error(message, "Error", 5000);
};
const showSuccessMessage = message => {
  NotificationManager.success(message, "Message", 3000);
};

const showInfoMessage = message => {
  NotificationManager.info(message, "Info", 3000);
};

let contract;
let web3;

let domainData = {
  name: "PlantManager",
  version: "1",
  chainId: "80001",  // Matic Mumbai
  verifyingContract: config.contract.address
};

const domainType = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" }
];

const metaTransactionType = [
  { name: "nonce", type: "uint256" },
  { name: "from", type: "address" }
];

function App() {
  const [account, setAccount] = useState('');
  const [plantManager, setPlantManager] = useState(null);

  const [inputAddPlantTHC, setInputAddPlantTHC] = useState();
  const [inputAddPlantCBD, setInputAddPlantCBD] = useState();
  const [inputGetPlantId, setInputGetPlantId] = useState();
  const [getPlant, setGetPlant] = useState();
  const [listPlants, setListPlants] = useState();

  useEffect(() => {
    if (!window.ethereum) {
      showErrorMessage("Metamask is required to use this DApp")
      return;
    }

    const biconomy = new Biconomy(window.ethereum, {apiKey: "3wxQ7sV9b.761f72da-9bf8-424b-8ede-bf781d44fd73" });
    web3 = new Web3(biconomy);

    biconomy.onEvent(biconomy.READY, async () => {
      // Initialize your dapp here like getting user accounts etc

      await window.ethereum.enable();

      // Load first account
      const [account] = await web3.eth.getAccounts();
      console.log ('account: ', account);
      setAccount(account);

      contract = await new web3.eth.Contract(config.contract.abi, config.contract.address);
      console.log("contract", contract);
      setPlantManager(contract);

    }).onEvent(biconomy.ERROR, (error, message) => {
        // Handle error while initializing mexa
        console.log(error)
    });
  }, []);

  const handleAddPlant = e => {
    e.preventDefault();

    console.log ('account: ', account);
    console.log ('THC: ', inputAddPlantTHC);
    console.log ('CBD: ', inputAddPlantCBD);
    plantManager.methods.addPlant(account, inputAddPlantTHC, inputAddPlantCBD)
      .send({ from: account })
      .once('receipt', receipt => {
        console.log ('transaction receipt: ', receipt);
        setInputAddPlantTHC();
        setInputAddPlantCBD();
      });
  };

  async function addPlantMeta () {

    const userAddress = window.ethereum.selectedAddress;
    const nonce = await contract.methods.getNonce(userAddress).call();
    console.log("userAddress:", userAddress, "Nonce: ", nonce);

    let message = {};
    message.nonce = parseInt(nonce);
    message.from = userAddress;
    
    const dataToSign = JSON.stringify({
      types: {
          EIP712Domain: domainType,
          MetaTransaction: metaTransactionType
        },
        domain: domainData,
        primaryType: "MetaTransaction",
        message: message
    });    

    console.log ('account: ', account);
    console.log ('THC: ', inputAddPlantTHC);
    console.log ('CBD: ', inputAddPlantCBD);

    window.web3.currentProvider.sendAsync(
      {
        jsonrpc: "2.0",
        id: 999999999999,
        method: "eth_signTypedData_v4",
        params: [window.ethereum.selectedAddress, dataToSign]
      },
      async function (err, result) {
        if (err) {
          return console.error(err);
        }
        const signature = result.result.substring(2);
        const r = "0x" + signature.substring(0, 64);
        const s = "0x" + signature.substring(64, 128);
        const v = parseInt(signature.substring(128, 130), 16);
        console.log(r, "r")
        console.log(s, "s")
        console.log(v, "v")
        console.log(window.ethereum.selectedAddress, "userAddress")

        const promiEvent = contract.methods
          .addPlantMeta(window.ethereum.selectedAddress, inputAddPlantTHC, inputAddPlantCBD, r, s, v)
          .send({
            from: window.ethereum.selectedAddress
          })
        promiEvent.on("transactionHash", (hash) => {
          showInfoMessage("Transaction sent successfully. Check Console for Transaction hash")
          console.log("Transaction Hash is ", hash)
        }).once("confirmation", (confirmationNumber, receipt) => {
          if (receipt.status) {
            showSuccessMessage("Transaction processed successfully")
            setInputAddPlantTHC();
            setInputAddPlantCBD();
          } else {
            showErrorMessage("Transaction Failed");
          }
          console.log(receipt)
        })
      }
    );
  };


  const handleAddPlantMeta = e => {
    e.preventDefault();
    addPlantMeta();
  };

  async function onButtonClickAddPlant() {
    addPlantMeta();
  }  

  const handleGetPlant = e => {
    e.preventDefault();
    console.log ('inputGetPlantId: ', inputGetPlantId);
    plantManager.methods
      .getPlant(inputGetPlantId).call()
      .then( function(res) {
        console.log ('res: ', res);
        setGetPlant(res);
        setInputGetPlantId(null);
      });

  };

  const handleListPlants = e => {
    e.preventDefault();

    plantManager.methods
      .listPlants().call()
      .then( function(list) {
        console.log ('listPlants: ', list);
        setListPlants(list);
      }); 
  }; 
  
  
  return (
    <Container>
      <div className="App">

        <div>
          <h1>Cannabis Plant Manager</h1>
          {account && <p>Account: {account}</p>}
          {plantManager && <p>PlantManager Address: {plantManager._address}</p>}
        </div>

        <Row>
          <Col className="mb-2" sm="12" md="6">
            <Card>
              <Card.Body>
                <Form onSubmit={handleAddPlantMeta}>
                  <Form.Group controlId="formAddPlantTHC">
                    <Form.Label>THC</Form.Label>
                    <Form.Control
                      placeholder="THC"
                      onChange={(e) => setInputAddPlantTHC(e.target.value)}
                      value={inputAddPlantTHC}
                    />
                  </Form.Group>
                  <Form.Group controlId="formAddPlantCBD">
                    <Form.Label>CBD</Form.Label>
                    <Form.Control
                      placeholder="CBD"
                      onChange={(e) => setInputAddPlantCBD(e.target.value)}
                      value={inputAddPlantCBD}
                    />
                  </Form.Group>                                                    
                  <Button type="submit">Add plant</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col className="mb-2" sm="12" md="6">
            <Card>
              <Card.Body>
                <Col>
                    <Form onSubmit={handleGetPlant}>
                      <Form.Group controlId="formGetPlantId">
                        <Form.Label>Plant Id</Form.Label>
                        <Form.Control
                          placeholder="Id"
                          onChange={(e) => setInputGetPlantId(e.target.value)}
                          value={inputGetPlantId}
                        />
                      </Form.Group>
                      <Button type="submit">Get</Button>
                    </Form>
                  </Col>
                  <Row>
                    {getPlant && <p>
                      Owner: {getPlant[0]} <br/>
                      THC: {getPlant[1]} <br/>
                      CBD: {getPlant[2]} <br/> </p>}
                  </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Card >
            <Card.Body>
              <Col>
                <Form onSubmit={handleListPlants}>
                  <Button type="submit">List Plants</Button>
                </Form>
                {listPlants && 
                  <p>List: 
                    {listPlants.map((item) => 
                      <li key={item.id}>{item[0]} {item[1]} {item[2]} {item[3]}</li>)
                    }
                  </p>
                }
              </Col>
            </Card.Body>
          </Card>
        </Row>

      </div>
    </Container>

  );
}

export default App;
