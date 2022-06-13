import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { User } from '../App';
import {
  Paragraph,
  Button,
  TextInput,
  Appbar,
  Checkbox,
  Portal,
  Dialog,
  Provider,
} from 'react-native-paper';

import { db } from '../fireBase';

import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  onGoBack: Function;
  onSetUser: Function;
  onLogIn: Function;
};

const SignUp: React.FC<Props> = ({ onGoBack, onSetUser, onLogIn }) => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [signUpError, setSignUpError] = useState(false);
  const [errorMessageKey, setErrorMessageKey] = useState(''); // '' or reqU or usedUser or reqP or repeat or terms
  const [showPassword, setShowPassword] = useState(true);
  const [showRPassword, setShowRPassword] = useState(true);
  const [id, setId] = useState('-1');
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  let md5 = require('md5');

  async function addUserToDB() {
    const su = await db
      .collection('users')
      .add({ name: userName, password: md5(password) })      
    setId(su.id);
    return su.id;
  }

  const ASsetUser = async (user: any) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      console.log('async storage ', e);
    }
  };

  async function signUp() {
    const usedUser = await checkUserNameUnused();
    if (!checkUserNameReq()) {
      return;
    }
    if (!usedUser) {
      return;
    }
    if (!checkRPassword()) {
      return;
    }
    if (!checkPasswordReq()) {
      return;
    }
    if (!checkedTerms) {
      setErrorMessageKey('terms');
      setSignUpError(true);
      return;
    }
    const userToAdd = { name: userName, id: await addUserToDB() };
    onSetUser(userToAdd);
    await ASsetUser(userToAdd);
    onGoBack();
    return;
  }

  function checkRPassword() {
    if (password === repeatPassword) {
      return true;
    }
    setSignUpError(true);
    setErrorMessageKey('repeat');
    return false;
  }

  function checkPasswordReq() {
    if (password.length < 6) {
      setSignUpError(true);
      setErrorMessageKey('reqP');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setSignUpError(true);
      setErrorMessageKey('reqP');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setSignUpError(true);
      setErrorMessageKey('reqP');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setSignUpError(true);
      setErrorMessageKey('reqP');
      return false;
    }
    return true;
  }

  async function checkUserNameUnused() {
    const muQS = await db
      .collection('users')
      .where('name', '==', userName)
      .get();
    let matchingUserA: User[] = [];
    muQS.forEach((u: any) => matchingUserA.push(u.data()));
    const matchingUser = matchingUserA[0];
    if (matchingUser === undefined) {
      return true;
    }

    setSignUpError(true);
    setErrorMessageKey('usedUser');
    return false;
  }

  function checkUserNameReq() {
    if (userName.length < 6) {
      setSignUpError(true);
      setErrorMessageKey('reqU');
      return false;
    }
    if (!/^[a-zA-Z0-9 ._-]+$/.test(userName)) {
      setSignUpError(true);
      setErrorMessageKey('reqU');
      return false;
    }
    return true;
  }

  return (
    <Provider>
      <View style={styles.cont}>
        <View>
          <Appbar.Header>
            <Appbar.BackAction onPress={() => onGoBack()} />
          </Appbar.Header>
          <TextInput
            value={userName}
            onChangeText={(newUserName: string) => setUserName(newUserName)}
            numberOfLines={1}
            style={styles.TIP}
            error={errorMessageKey === 'reqU' || errorMessageKey === 'usedUser'}
            mode="outlined"
            label="User Name"></TextInput>
          <TextInput
            value={password}
            onChangeText={(newPassword: string) => setPassword(newPassword)}
            numberOfLines={1}
            secureTextEntry={showPassword}
            style={styles.TIP}
            error={errorMessageKey === 'reqP' || errorMessageKey === 'repeat'}
            right={
              <TextInput.Icon
                name="eye"
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            mode="outlined"
            label="Password"></TextInput>
          <TextInput
            value={repeatPassword}
            onChangeText={(newPassword: string) =>
              setRepeatPassword(newPassword)
            }
            numberOfLines={1}
            secureTextEntry={showRPassword}
            style={styles.TIP}
            right={
              <TextInput.Icon
                name="eye"
                onPress={() => setShowRPassword(!showRPassword)}
              />
            }
            mode="outlined"
            label="Repeat password"></TextInput>
          <Checkbox.Item
            label={
                `I've read, understood and accept this App Terms & Conditions`
            }
            status={checkedTerms ? 'checked' : 'unchecked'}
            onPress={() => setCheckedTerms(!checkedTerms)}
          />
          <Button
            mode="contained"
            onPress={() => signUp()}
            style={styles.signUp}>
            SIGN UP
          </Button>
          {signUpError ? (
            <Paragraph style={styles.signUpError}>
              {errorMessageKey === 'reqU'
                ? 'User name must be atlist 6 charecters, and with no speciel charecters except _-.'
                : errorMessageKey === 'usedUser'
                ? 'User name is already used'
                : errorMessageKey === 'reqP'
                ? 'Password must be atlist 6 charecters, and include atlist one uppercase letter, on lower case letter and one digit'
                : errorMessageKey === 'repeat'
                ? 'Passwords do not match'
                : errorMessageKey === 'terms'
                ? 'You must agree to our (very fair if I say so myself) Terms & Conditions'
                : null}
            </Paragraph>
          ) : null}
          <Paragraph style={styles.LIText}>
            Allready have an account?{' '}
          </Paragraph>
          <Button onPress={() => onLogIn()} style={styles.logIn}>
            Log In
          </Button>
        </View>
        <Portal>
          <Dialog visible={termsOpen} dismissable={false}>
            <Dialog.Title>Terms & Conditions</Dialog.Title>
            <Dialog.Content>
              <Paragraph>
                we can sell ur soul to the devil and stuff we get the money bluh
                bluh bluh dont even think about ur privacy u allready know this
                kind of shis just read the facebook terms its more or less the
                same and u cant sue us
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                uppercase={false}
                onPress={() => {
                  setTermsOpen(false);
                  setCheckedTerms(true);
                }}>
                yeah i agree whatever
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <Button
          onPress={() => setTermsOpen(true)}
          color="#808080"
          uppercase={false}>
          To our Terms & Conditions
        </Button>
      </View>
    </Provider>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  TIP: {
    margin: 3,
  },
  signUp: {
    margin: 3,
  },
  signUpError: {
    color: 'red',
    //alignSelf: 'center',
  },
  logIn: {
    width: 150,
  },
  LIText: {
    margin: 3,
  },
  cont: {
    justifyContent: 'space-between',
    height: Dimensions.get('window').height,
  },
});
