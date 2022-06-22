import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Input, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import './Chat.css';
import abi from '../utils/WavePortal.json';

const Balloon = ({ children, time, isMine }) => {
  const date = new Date(time * 1000).toLocaleTimeString('ja-JP');
  if (isMine) {
    return (
      <div style={{ textAlign: 'right' }}>
        <div className="time">
          <p>{`${date.split(':')[0]}時${date.split(':')[1]}分`}</p>
        </div>
        <div className={isMine ? 'balloon-right' : 'balloon-left'}>
          <p className="balloon-text">{children}</p>
        </div>
      </div>
    );
  } else {
    return (
      <div style={{ textAlign: 'left' }}>
        <div className="balloon-left">
          <p>{children}</p>
        </div>
        <div className="time">
          <p>{`${date.split(':')[0]}時${date.split(':')[1]}分`}</p>
        </div>
      </div>
    );
  }
};

const Chat = ({ currentGroup }) => {
  const contractAddress = '0x571892110487dA6fC410D7065aDa8807f125CC68';
  const contractABI = abi.abi;
  const [allWaves, setAllWaves] = useState([]);
  const [messageValue, setMessageValue] = useState('');
  const [myAddress, setMyAddress] = useState();

  const scrollBottom = () => {
    let target = document.getElementById('Chats');
    if (target) {
      target.scrollTop = target.scrollHeight;
    }
  };

  const getAllWaves = async (group) => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        setMyAddress(provider.provider.selectedAddress);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let waves = await wavePortalContract.getAllWaves(group.toNumber());
        const waveCleaned = waves.map(({ waver, message, timestamp }) => {
          return { waver, message, timestamp: timestamp.toNumber() };
        });
        setAllWaves(waveCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
      scrollBottom();
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        let contractBalance = await provider.getBalance(
          wavePortalContract.address
        );
        console.log(
          'Contractbalance:',
          ethers.utils.formatEther(contractBalance)
        );
        const waveTxn = await wavePortalContract.wave(
          messageValue,
          currentGroup.toNumber()
        );
        console.log('Mining...', waveTxn.hash);
        await waveTxn.wait();
        console.log('Mined -- ', waveTxn.hash);
        message.success(`Send Message: {${messageValue.slice(0, 10)}}`);
        let contractBalance_post = await provider.getBalance(
          wavePortalContract.address
        );
        if (contractBalance_post < contractBalance) {
          console.log('User won ETH!');
          message.info('You won ETH!');
        } else {
          console.log(
            'ContractBalance after wave:',
            ethers.utils.formatEther(contractBalance_post)
          );
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      message.error("Your message couldn't reach");
      console.log(error);
    }
  };

  const onClick = async () => {
    await wave();
    setMessageValue('');
  };

  useEffect(() => {
    const onNewWave = (from, groupId, timestamp, message) => {
      if (currentGroup && groupId.toNumber() !== currentGroup.toNumber()) {
        return;
      }
      setAllWaves((prevState) => [
        ...prevState,
        {
          waver: from,
          timestamp: timestamp.toNumber(),
          message: message,
        },
      ]);
      scrollBottom();
    };
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );
    const filter = wavePortalContract.filters.NewWave(null, null, null, null);
    wavePortalContract.on(filter, onNewWave);
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, [currentGroup]);

  useEffect(() => {
    (async () => {
      if (currentGroup !== undefined) {
        await getAllWaves(currentGroup);
      }
    })();
  }, [currentGroup]);

  if (currentGroup !== undefined) {
    return (
      <div>
        <div id="Chats">
          {allWaves.map((wave, index) => {
            let isMine = wave.waver.toLowerCase() === myAddress;
            const beforeWave = allWaves[index - 1];
            const options = {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
            };
            let beforeDate;
            let currentDate;
            if (beforeWave) {
              beforeDate = new Date(beforeWave.timestamp * 1000);
            } else {
              beforeDate = new Date(0);
            }
            currentDate = new Date(wave.timestamp * 1000);
            return (
              <div key={index} className="Chats-inner">
                {beforeDate &&
                beforeDate.toLocaleDateString('ja-JA', options) !==
                  currentDate.toLocaleDateString('ja-JA', options) ? (
                  <p className="date">
                    {currentDate.toLocaleDateString('ja-JA', options)}
                  </p>
                ) : (
                  <></>
                )}
                <p
                  style={{
                    textAlign: isMine ? 'right' : 'left',
                    marginBottom: 0,
                  }}
                >
                  {wave.waver.slice(0, 10)}
                </p>
                <Balloon time={wave.timestamp} isMine={isMine}>
                  {wave.message}
                </Balloon>
              </div>
            );
          })}
        </div>
        <div className="textBox">
          <Input
            onChange={(e) => {
              setMessageValue(e.target.value);
            }}
            value={messageValue}
          />
          <SendOutlined className="sendBtn" onClick={onClick} />
        </div>
      </div>
    );
  } else {
    return (
      <div className="notSelected">
        <h1>会話するグループを選択して下さい</h1>
      </div>
    );
  }
};

export default Chat;
