import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from 'react-native';

import { Joke, User } from '../App';

import { db } from '../fireBase';

import JokeView from './JokeView';

import {
  FAB,
  Appbar,
  Avatar,
  Menu,
  Provider,
} from 'react-native-paper';

import { FontAwesome } from '@expo/vector-icons';

type Props = {
  user: User;
  signOut: Function;
  setScreen: Function;
  setProfU: Function;
  setShowSB: Function;
  userNameToIcon: Function;
  notLogedIn: Function;
  addUserToJokes: Function;
  sortToCT: Function;
};

const Home: React.FC<Props> = ({
  user,
  signOut,
  setScreen,
  setProfU,
  setShowSB,
  userNameToIcon,
  notLogedIn,
  addUserToJokes,
  sortToCT,
}) => {
  const [jokesArray, setJokesArray]: any[] = useState([]);
  const [userMenu, setUserMenu] = useState(false);
  const [sortMenu, setSortMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState('new'); // new or popular

  const getAllJokes = useCallback(async () => {
    const jokesData = await db.collection('jokes').get();
    const allJokes: Joke[] = [];
    jokesData.forEach((obj: any) =>
      allJokes.push({ id: obj.id, ...obj.data() })
    );
    const allActive = allJokes.filter(
      (j: Joke) => !j.hasOwnProperty('deleted')
    );
    const jokesWithUsers = await addUserToJokes(allActive);

    const allLikes: string[] = (await db.collection('likes').get()).docs.map(
      (obj: any) => obj.data()
    );
    const summedArrayObj = allLikes.reduce((p: any, c: any) => {
      let temp = p;
      if (p[c.joke] === undefined) {
        temp[c.joke] = c.action;
        return temp;
      }
      temp[c.joke] += c.action;
      return temp;
    }, {});
    const jokesWithLikes = jokesWithUsers.map((j: Joke) => {
      if (summedArrayObj[j.id || ''] !== undefined) {
        return { ...j, likes: summedArrayObj[j.id || ''] };
      }
      return { ...j, likes: 0 };
    });
    jokesWithLikes.sort(sortToCT);

    return jokesWithLikes;
  }, [addUserToJokes, sortToCT]);

  useEffect(() => setShowSB(false), [setShowSB]);

  function sortToLikes(a: Joke, b: Joke) {
    return (b.likes || 0) - (a.likes || 0);
  }

  function changeSort(sortType: string) {
    const JAcopy = jokesArray.slice();
    if (sortType === 'new') {
      setJokesArray(JAcopy.sort(sortToCT));
      setSort('new');
    } else {
      setJokesArray(JAcopy.sort(sortToLikes));
      setSort('popular');
    }
    setSortMenu(false);
    return;
  }

  useEffect(() => {
    getAllJokes().then((p: any) => {
      console.log('p ', p);
      setJokesArray(p);
    });
  }, [getAllJokes]);

  async function onRefresh() {
    setRefreshing(true);
    setJokesArray(await getAllJokes());
    setShowSB(false);
    setSort('new');
    setRefreshing(false);
  }

  function onPlusButton() {
    if (user.id !== '-1') {
      setScreen('newJoke');
      return 'newJoke';
    }
    setScreen('logIn');
    setShowSB(true);
    return 'logIn';
  }

  return (
    <Provider>
      <Appbar.Header style={styles.top}>
        <Appbar.Content title="" />
        <Menu
          visible={sortMenu}
          onDismiss={() => setSortMenu(false)}
          style={styles.userIcon}
          anchor={
            <Appbar.Action
              icon={(props: any) => (
                <FontAwesome
                  {...props}
                  name="sort"
                  onPress={() => setSortMenu(true)}
                />
              )}
            />
          }>
          <Menu.Item
            onPress={() => {
              changeSort('new');
            }}
            title="Latest"
          />
          <Menu.Item onPress={() => changeSort('popular')} title="Popular" />
        </Menu>
        {user.id !== '-1' ? (
          <Menu
            visible={userMenu}
            onDismiss={() => setUserMenu(false)}
            style={styles.userIcon}
            anchor={
              <Appbar.Action
                icon={(props: any) => (
                  <Avatar.Text
                    {...props}
                    label={userNameToIcon(user.name)}
                    color="white"
                  />
                )}
                onPress={() => setUserMenu(true)}
                style={styles.userIcon}
              />
            }>
            <Menu.Item
              onPress={() => {
                setProfU(user);
                setScreen('profile');
              }}
              title="Profile"
            />
            <Menu.Item onPress={async () => await signOut()} title="Sign out" />
          </Menu>
        ) : (
          <Appbar.Action
            icon="login"
            onPress={() => setScreen('logIn')}
            style={styles.userIcon}
          />
        )}
      </Appbar.Header>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {jokesArray.map((e: any, i: any) => (<JokeView
          value={e}
          key={i}
          userNameToIcon={userNameToIcon}
          user={user}
          setScreen={setScreen}
          setProfU={setProfU}
          notLogedIn={notLogedIn}
          reloadPage={async () =>
            setJokesArray(await getAllJokes())
          }></JokeView>))}
      </ScrollView>
      <FAB
        style={styles.fab}
        disabled={false}
        onPress={() => onPlusButton()}
        icon="plus"
      />
    </Provider>
  );
};

export default Home;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  top: {
    backgroundColor: 'white',
  },
  userIcon: {
    marginLeft: 'auto',
  },
});
