// App.js
import React, { useEffect, useState } from 'react';
import { Button, Affix, Form, Input, Modal } from 'antd';
import './App.css';
import Card from './components/card';
import Chat from './components/Chat';
/* ethers 変数を使えるようにする*/
import { ethers } from 'ethers';
/* ABIファイルを含むWavePortal.jsonファイルをインポートする*/
import abi from './utils/WavePortal.json';

const App = () => {
  /* ユーザーのパブリックウォレットを保存するために使用する状態変数を定義 */
  const [currentAccount, setCurrentAccount] = useState('');
  const [currentGroup, setCurrentGroup] = useState(undefined);
  /* すべてのwavesを保存する状態変数を定義 */
  const [allGroups, setAllGroups] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formText, setFormText] = useState('');
  /* デプロイされたコントラクトのアドレスを保持する変数を作成 */
  const contractAddress = '0x571892110487dA6fC410D7065aDa8807f125CC68';
  /* コントラクトからすべてのwavesを取得するメソッドを作成 */
  /* ABIの内容を参照する変数を作成 */
  const contractABI = abi.abi;

  const getAllGroups = async () => {
    const { ethereum } = window;
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let groups = await wavePortalContract.getAllGroups();
        /* UIに必要なのは、アドレス、タイムスタンプ、メッセージだけなので、以下のように設定 */
        const groupCleaned = groups.map(({ groupId, groupName, timestamp }) => {
          return {
            groupId,
            groupName,
            timestamp: timestamp.toNumber(),
          };
        });
        /* React Stateにデータを格納する */
        setAllGroups(groupCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const createGroup = async (groupName) => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        console.log('creating group', groupName);
        await wavePortalContract.createGroup(groupName);
        console.log('group created');
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewGroup = (from, timestamp, groupName, groupId) => {
      setAllGroups((prevState) => [
        ...prevState,
        {
          timestamp: timestamp.toNumber(),
          groupName,
          groupId,
        },
      ]);
    };

    /* NewWaveイベントがコントラクトから発信されたときに、情報をを受け取ります */
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on('NewGroup', onNewGroup);
    }
    /*メモリリークを防ぐために、NewWaveのイベントを解除します*/
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('newGroup', onNewGroup);
      }
    };
  }, []);

  /* window.ethereumにアクセスできることを確認する関数を実装 */
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log('Make sure you have MetaMask!');
        return;
      } else {
        console.log('We have the ethereum object', ethereum);
      }
      /* ユーザーのウォレットへのアクセスが許可されているかどうかを確認 */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account:', account);
        setCurrentAccount(account);
        getAllGroups();
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.log(error);
    }
  };
  /* connectWalletメソッドを実装 */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log('Connected: ', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  /* WEBページがロードされたときにcheckIfWalletIsConnected()を実行 */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const onClick = (group) => {
    setCurrentGroup(group.groupId);
  };

  const onOk = async () => {
    await createGroup(formText);
    setFormText('');
    setIsModalVisible(false);
  };
  const onCancel = () => {
    setFormText('');
    setIsModalVisible(false);
  };

  return (
    <>
      <header>
        <p>Say hai</p>
      </header>
      <div className="wrapper">
        <div className="groups">
          {allGroups.map((group, index) => (
            <Card
              onClick={() => onClick(group)}
              key={index}
              group={group}
              isSelected={currentGroup === group.groupId ? true : false}
            />
          ))}
        </div>

        <div className="chat">
          <Chat currentGroup={currentGroup} />
        </div>
      </div>

      <div>
        <Affix offsetBottom={30} style={{ position: 'fixed', left: '100px' }}>
          <Button
            shape="round"
            type="primary"
            className="groupButton"
            size="large"
            onClick={() => {
              currentAccount !== '' ? setIsModalVisible(true) : connectWallet();
            }}
          >
            {currentAccount !== '' ? 'Create Group' : 'Connect Wallet'}
          </Button>
        </Affix>

        <Modal visible={isModalVisible} onOk={onOk} onCancel={onCancel}>
          <Form>
            <Form.Item label="groupName" name="groupName">
              <Input
                onChange={(e) => {
                  setFormText(e.target.value);
                }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
};
export default App;
