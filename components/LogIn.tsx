import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Image, Pressable } from 'react-native';
import { Joke, User } from '../App';
import {
  Card,
  Paragraph,
  Button,
  Title,
  Avatar,
  IconButton,
  TextInput,
  Appbar,
  Snackbar,
} from 'react-native-paper';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

import { db } from '../fireBase';

import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  onGoBack: Function;
  onSetUser: Function;
  onSignUp: Function;
  showSBprop: boolean;
};

const LogIn: React.FC<Props> = ({
  onGoBack,
  onSetUser,
  onSignUp,
  showSBprop,
}) => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [logInError, setLogInError] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [showSB, setShowSB] = useState(showSBprop);

  let md5 = require('md5');

  async function findFBUser() {
    const muQS = (await db
      .collection('users')
      .where('name', '==', userName)
      .get()).docs;
    let matchingUserA: any[] = [];
    muQS.forEach((u: any, i: number) => {
      matchingUserA.push(u.data());
      matchingUserA[0].id = u.id;
    });
    const matchingUser = matchingUserA[0];
    return matchingUser;
  }

  const ASsetUser = async (user: any) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      console.log('async storage ', e);
    }
  };

  async function logIn() {
    const FBUSer = await findFBUser();
    if (FBUSer === undefined) {
      setLogInError(true);
      return;
    }
    if (FBUSer.password === md5(password)) {
      onSetUser({ name: FBUSer.name, id: FBUSer.id });
      await ASsetUser({ name: FBUSer.name, id: FBUSer.id });

      onGoBack();
      return;
    }
    setLogInError(true);
    return;
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => onGoBack()} />
      </Appbar.Header>
      <TextInput
        value={userName}
        onChangeText={(newUserName: string) => setUserName(newUserName)}
        numberOfLines={1}
        style={styles.TIP}
        error={logInError}
        mode="outlined"
        label="User Name"></TextInput>
      <TextInput
        value={password}
        onChangeText={(newPassword: string) => setPassword(newPassword)}
        numberOfLines={1}
        secureTextEntry={showPassword}
        style={styles.TIP}
        error={logInError}
        right={
          <TextInput.Icon
            name="eye"
            onPress={() => setShowPassword(!showPassword)}
          />
        }
        mode="outlined"
        label="Password"></TextInput>
      <Button mode="contained" onPress={() => logIn()} style={styles.logIn}>
        LOG IN
      </Button>
      {logInError ? (
        <Paragraph style={styles.logInError}>
          User name and password do not match you piece of shit
        </Paragraph>
      ) : null}
      <Paragraph style={styles.SUText}>{`Don't have an account?`} </Paragraph>
      <Button onPress={() => onSignUp()} style={styles.signUp}>
        Sign Up
      </Button>
      <Snackbar visible={showSB} onDismiss={() => setShowSB(false)}>
        You must login in order to do things you piece of shit
      </Snackbar>
    </>
  );
};

export default LogIn;

const styles = StyleSheet.create({
  TIP: {
    margin: 3,
  },
  logIn: {
    margin: 3,
  },
  logInError: {
    color: 'red',
    alignSelf: 'center',
  },
  signUp: {
    width: 150,
  },
  SUText: {
    margin: 3,
  },
});
