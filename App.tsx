import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
} from 'react-native';

import * as Battery from 'expo-battery';

import { db } from './fireBase';

import UploadJoke from './components/UploadJoke';
import LogIn from './components/LogIn';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import Home from './components/Home';
import Personal from './components/Personal';
const audiofile = require('./assets/audio.mp3')
import {
  Paragraph,
  Button,
  Provider,
  BottomNavigation,
  Portal,
  Dialog,
} from 'react-native-paper';

import {Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Audio } from 'expo-av'

const App: React.FC = () => {
  let md5 = require('md5');

  const [screen, setScreen] = useState('home');
  const [user, setUser] = useState({ name: '', id: '-1' });
  const [profU, setProfU] = useState(user);
  const [showSB, setShowSB] = useState(false);
  const [showBatJoke, setShowBatJoke] = useState(false);
  const [playAudio, setPlayAudio] = useState(false)
  const [sound, setSound] = useState(undefined as Audio.Sound | undefined)

  async function playSound() {
    let soundFromFile
    if (sound === undefined) {
      soundFromFile = (await Audio.Sound.createAsync(audiofile)).sound;
      setSound(soundFromFile)
    } else {
      soundFromFile = sound
    }
    await soundFromFile.playAsync();
    setPlayAudio(true)
  }

  useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  async function stopSound() {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync()
      setPlayAudio(false)
    }
  }

  useEffect(() => {

    Battery.addBatteryStateListener((event: any) => {
      if (event.batteryState === 2) {
        if (!playAudio) {
          playSound()
        }
        setShowBatJoke(true);
        return;
      }

      else {
        if (playAudio) {
          stopSound()
        }
        return;
      }
    });
  }, [sound, playAudio]);

  useEffect(() => setShowSB(false), [screen]);

  useEffect(() => {
    ASgetUser().then((p: any) => {
      if (p !== null) {
        setUser(p);
      }
    });
  }, []);

  function userNameToIcon(name: string) {
    const splitedName = name.split(' ');
    if (splitedName.length === 1) {
      return splitedName[0][0].toUpperCase();
    }
    return (
      splitedName[0][0] + splitedName[splitedName.length - 1][0]
    ).toUpperCase();
  }

  const ASgetUser = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user');
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
    }
  };

  const ASremoveUser = async () => {
    try {
      await AsyncStorage.removeItem('user');
    } catch (e) {
    }
  };

  async function signOut() {
    setUser({ name: '', id: '-1' });
    await ASremoveUser();
  }

  async function addUserToJokes(jokeArray: Joke[]) {
    const allUsers = (await db.collection('users').get()).docs.map(
      (obj: any) => {
        return { ...obj.data(), id: obj.id };
      }
    );
    const jokesWithUsers = jokeArray.map((j: Joke, i: number) => {
      const matchingUser = allUsers.find((u: User) => u.id === j.user);
      return { ...j, user: matchingUser };
    });
    return jokesWithUsers;
  }

  const HomeRoute = () => (
    <Home
      user={user}
      signOut={signOut}
      setScreen={setScreen}
      setProfU={setProfU}
      setShowSB={setShowSB}
      userNameToIcon={userNameToIcon}
      notLogedIn={notLogedIn}
      addUserToJokes={addUserToJokes}
      sortToCT={sortToCT}></Home>
  );

  const PersonalRoute = () => (
    <Personal
      user={user}
      userNameToIcon={userNameToIcon}
      setScreen={setScreen}
      setShowSB={() => setShowSB(true)}
      setProfU={setProfU}
      onSetUser={setUser}
      notLogedIn={notLogedIn}
      signOut={signOut}
      addUserToJokes={addUserToJokes}
      sortToCT={sortToCT}></Personal>
  );

  const ProfileRoute = () => (
    <Profile
      onGoBack={() => {
        setScreen('home');
        setIndex(0);
      }}
      user={user}
      profile={user}
      userNameToIcon={userNameToIcon}
      setScreen={setScreen}
      setProfU={setProfU}
      notLogedIn={notLogedIn}
      signOut={signOut}></Profile>
  );
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    { key: 'home', title: 'Home', icon: 'home' },
    { key: 'personal', title: 'Personal', icon: 'heart' },
    {
      key: 'profile',
      title: 'Profile',
      icon: (props: any) => <Ionicons {...props} name="person" />,
    },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: HomeRoute,
    personal: PersonalRoute,
    profile: ProfileRoute,
  });

  function onIndexChange(index: number) {
    if (!notLogedIn()) {
      setIndex(index);
      return;
    }
    return;
  }

  function notLogedIn() {
    if (user.id !== '-1') {
      return false;
    }
    setScreen('logIn');
    setShowSB(true);
    return true;
  }

  function sortToCT(a: any, b: any) {
    if (!b.hasOwnProperty('creationTime')) {
      return -1;
    }
    if (!a.hasOwnProperty('creationTime')) {
      return 1;
    }
    return b.creationTime - a.creationTime;
  }

  if (screen === 'home') {
    return (
      <Provider>
        <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={(i: number) => onIndexChange(i)}
          renderScene={renderScene}
          shifting={true}
        />
        <Portal>
          <Dialog visible={showBatJoke} onDismiss={() => setShowBatJoke(false)}>
            <Dialog.Content>
              <Paragraph>{`Robin: Batman, the Batmobile won't start \nBatman: Check the battery \nRobin: What's a Tery? \nBatman:`}</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setShowBatJoke(false);
                }}>
                Close
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </Provider>
    );
  }

  if (screen === 'newJoke') {
    return (
      <>
        <UploadJoke
          onGoBack={() => {
            setScreen('home');
            setIndex(0);
          }}
          user={user}></UploadJoke>
      </>
    );
  }
  if (screen === 'logIn') {
    return (
      <>
        <LogIn
          onGoBack={() => {
            setScreen('home');
            setIndex(0);
          }}
          onSetUser={setUser}
          onSignUp={() => setScreen('signUp')}
          showSBprop={showSB}></LogIn>
      </>
    );
  }
  if (screen === 'signUp') {
    return (
      <>
        <SignUp
          onGoBack={() => {
            setScreen('home');
            setIndex(0);
          }}
          onSetUser={setUser}
          onLogIn={() => setScreen('logIn')}></SignUp>
      </>
    );
  }
  if (screen === 'profile') {
    return (
      <>
        <Profile
          onGoBack={() => {
            setScreen('home');
            setIndex(0);
          }}
          user={user}
          profile={profU}
          userNameToIcon={userNameToIcon}
          setScreen={setScreen}
          setProfU={setProfU}
          notLogedIn={notLogedIn}
          signOut={signOut}></Profile>
      </>
    );
  }
  return <></>;
};

export default App;

export interface Joke {
  mainText: string;
  hiddenText?: string;
  image?: string;
  likes?: number;
  user: User | string;
  id?: string;
  creationTime?: any;
  deleted?: boolean;
}

export interface User {
  name: string;
  id?: string;
  password?: string;
}


const styles = StyleSheet.create({});
