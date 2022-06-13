import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Joke, User } from '../App';
import {
  Card,
  Paragraph,
  Button,
  Title,
  Avatar,
  IconButton,
  Appbar,
  TextInput,
  Menu,
  Provider,
} from 'react-native-paper';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

import JokeView from './JokeView';

import { db } from '../fireBase';

type Props = {
  user: User;
  userNameToIcon: Function;
  setScreen: Function;
  setShowSB: Function;
  setProfU: Function;
  onSetUser: Function;
  notLogedIn: Function;
  signOut: Function;
  addUserToJokes: Function;
  sortToCT: Function;
};

const Personal: React.FC<Props> = ({
  user,
  userNameToIcon,
  setScreen,
  setShowSB,
  setProfU,
  onSetUser,
  notLogedIn,
  signOut,
  addUserToJokes,
  sortToCT,
}) => {
  const [followingArray, setFollowingArray] = useState([]);
  const [savedArray, setSavedArray] = useState([]);
  const [chosen, setChosen] = useState('following'); // following or saved
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    setFollowingArray(await getFollowingJokes());
    setSavedArray(await getSavedJokes());
    setShowSB(false);
    setRefreshing(false);
  }

  const getFollowingJokes = useCallback(async () => {
    const followingDB = (
      await db
        .collection('followers')
        .where('action', '==', 'follow')
        .where('follower', '==', user.id)
        .get()
    ).docs;
    console.log('followingDB ', followingDB)
    const followingDBdata = followingDB.map((obj: any) => obj.data())
    const followingIdArray = followingDBdata.map(j => j.followed);
    const followingJokes = (await db.collection('jokes').get()).docs
      .map((obj: any) => {
        return { ...obj.data(), id: obj.id };
      })
      .filter((j) => followingIdArray.includes(j.user));
    const allActive = followingJokes.filter(
      (j: Joke) => !j.hasOwnProperty('deleted')
    );
    const jokesWithUsers = await addUserToJokes(allActive);
    jokesWithUsers.sort(sortToCT);
    return jokesWithUsers;
  }, [addUserToJokes, user, sortToCT]);

  const getSavedJokes = useCallback(async () => {
    const savedDB = (
      await db
        .collection('saved')
        .where('action', '==', true)
        .where('user', '==', user.id)
        .get()
    ).docs;
    const savedIdArray = savedDB.map((obj: any) => obj.data().post);
    const savedJokes = (await db.collection('jokes').get()).docs
      .map((obj: any) => {
        return { ...obj.data(), id: obj.id };
      })
      .filter(j => savedIdArray.includes(j.id));
    const allActive = savedJokes.filter(
      (j: Joke) => !j.hasOwnProperty('deleted')
    );
    const jokesWithUsers = await addUserToJokes(allActive);
    jokesWithUsers.sort(sortToCT);
    return jokesWithUsers;
  }, [addUserToJokes, user, sortToCT]);

  useEffect(() => {
    getFollowingJokes().then((p: any) => {
      setFollowingArray(p);
    });
  }, [getFollowingJokes, user]);

  useEffect(() => {
    getSavedJokes().then((p: any) => {
      setSavedArray(p);
    });
  }, [getSavedJokes, user]);

  function choseArray() {
    if (chosen === 'following') {
      return followingArray;
    }
    return savedArray;
  }

  return (
    <Provider>
      <Appbar.Header style={styles.top}>
        <Button
          mode={chosen === 'following' ? 'contained' : 'outlined'}
          style={styles.topButton}
          onPress={() => setChosen('following')}>
          Following
        </Button>
        <Button
          mode={chosen === 'saved' ? 'contained' : 'outlined'}
          style={styles.topButton}
          onPress={() => setChosen('saved')}>
          Saved
        </Button>
      </Appbar.Header>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {choseArray().map((e: any, i: any) => (
          <JokeView
            value={e}
            key={i}
            userNameToIcon={userNameToIcon}
            user={user}
            setScreen={setScreen}
            setProfU={setProfU}
            notLogedIn={notLogedIn}
            reloadPage={async () => {
              setFollowingArray(await getFollowingJokes());
              setSavedArray(await getSavedJokes());
            }}></JokeView>
        ))}
      </ScrollView>
    </Provider>
  );
};

export default Personal;

const styles = StyleSheet.create({
  top: {
    backgroundColor: 'white',
    flexDirection: 'row',
  },
  topButton: {
    flex: 1,
  },
});
