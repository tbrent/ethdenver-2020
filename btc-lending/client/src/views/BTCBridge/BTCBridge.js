import React from 'react';

import TBTC from '@keep-network/tbtc.js';

// @material-ui/core
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import InputAdornment from '@material-ui/core/InputAdornment';

import Icon from '@material-ui/core/Icon';
import AccountBalance from '@material-ui/icons/AccountBalance';
import Add from '@material-ui/icons/Add';
// @material-ui/icons
import GridItem from 'components/Grid/GridItem.js';
import GridContainer from 'components/Grid/GridContainer.js';
import Table from 'components/Table/Table.js';
import Tasks from 'components/Tasks/Tasks.js';
import CustomTabs from 'components/CustomTabs/CustomTabs.js';
import Danger from 'components/Typography/Danger.js';
import Card from 'components/Card/Card.js';
import CardHeader from 'components/Card/CardHeader.js';
import CardIcon from 'components/Card/CardIcon.js';
import CardBody from 'components/Card/CardBody.js';
import CardFooter from 'components/Card/CardFooter.js';

import styles from 'assets/jss/material-dashboard-react/views/dashboardStyle.js';

import { useWeb3Injected, useWeb3Network } from '@openzeppelin/network/react';

const infuraToken = 'a5df6a93ae4f460e972e04fa5398d157';

const BN = require('bn.js');

const useStyles = makeStyles(styles);

export default function BTCBridge() {
  const classes = useStyles();

  const [listeners, setListeners] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [tbtc, setTBTC] = React.useState('');

  const injected = useWeb3Injected();
  const isHttp = window.location.protocol === 'http:';
  const local = useWeb3Network('http://127.0.0.1:8545');
  const network = useWeb3Network(`wss://ropsten.infura.io/ws/v3/${infuraToken}`, {
    pollInterval: 10 * 1000,
  });

  async function runAction() {
    console.log(injected);
    injected.lib.accounts = injected.accounts;
    return await TBTC.withConfig({
      web3: injected.lib,
      bitcoinNetwork: 'testnet',
      electrum: {
        testnet: {
          server: 'electrumx-server.test.tbtc.network',
          port: 50002,
          protocol: 'ssl',
        },
        testnetPublic: {
          server: 'testnet1.bauerj.eu',
          port: 50002,
          protocol: 'ssl',
        },
        testnetWS: {
          server: 'electrumx-server.test.tbtc.network',
          port: 50003,
          protocol: 'ws',
        },
      },
    });
  }

  async function runDeposit(deposit, mintOnActive) {
    deposit.autoSubmit();

    return new Promise(async (resolve, reject) => {
      deposit.onBitcoinAddressAvailable(async address => {
        try {
          const lotSize = await deposit.getSatoshiLotSize();
          console.log('\tGot deposit address:', address, '; fund with:', lotSize.toString(), 'satoshis please.');
          console.log('Now monitoring for deposit transaction...');
        } catch (err) {
          reject(err);
        }
      });

      deposit.onActive(async () => {
        try {
          if (mintOnActive) {
            console.log('Deposit is active, minting...');
            const tbtc = await deposit.mintTBTC();

            resolve(tbtc);
          } else {
            resolve('Deposit is active. Minting disabled by parameter.');
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  async function createDeposit(satoshiLotSize, mintOnActive) {
    const deposit = await tbtc.Deposit.withSatoshiLotSize(satoshiLotSize);

    return runDeposit(deposit, mintOnActive);
  }

  const beginDeposit = () => {
    const asBN = new BN(amount);

    tbtc.Deposit.availableSatoshiLotSizes().then(lot_sizes => {
      createDeposit(lot_sizes[0], true).then(inner => {
        console.log(inner);
      });
    });
  };

  React.useEffect(() => {
    setListeners(1);
    if (listeners < 1) {
      setTimeout(function() {
        runAction().then(result => {
          setTBTC(result);
          console.log('set TBTC');
          console.log(result);
        });
      }, 3000);
    }
  }, []);

  return (
    <div>
      <GridContainer>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <OutlinedInput
              id="outlined-adornment-weight"
              value={amount}
              onChange={event => setAmount(event.target.value)}
              endAdornment={<InputAdornment position="end">Satoshis</InputAdornment>}
              aria-describedby="outlined-weight-helper-text"
              inputProps={{
                'aria-label': 'Bitcoin',
              }}
              labelWidth={0}
            />
            <Button variant="contained" color="primary" className={classes.button} onClick={beginDeposit}>
              Deposit
            </Button>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardHeader color="success" stats icon>
              <CardIcon color="success">
                <AccountBalance />
              </CardIcon>
              <p className={classes.cardCategory}>Balance</p>
              <h3 className={classes.cardTitle}>
                0 <small>BTC</small>
              </h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>Bitcoin</div>
            </CardFooter>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
