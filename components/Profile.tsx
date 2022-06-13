import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Joke, User } from '../App';
import {
  Card,
  Paragraph,
  Button,
  Title,
  Appbar,
  Provider,
} from 'react-native-paper';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

import JokeView from './JokeView';

import { db } from '../fireBase';

type Props = {
  onGoBack: Function;
  user: User;
  profile: User;
  userNameToIcon: Function;
  setScreen: Function;
  setProfU: Function;
  notLogedIn: Function;
  signOut: Function;
};

const Profile: React.FC<Props> = ({
  onGoBack,
  user,
  profile,
  userNameToIcon,
  setScreen,
  setProfU,
  notLogedIn,
  signOut,
}) => {
  const [userJokes, setUserJokes]: any[] = useState([]);
  const [rating, setRating] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followed, setFollowed] = useState(false);

  const getAllJokes = useCallback(async () => {
    const jokesData = await db
      .collection('jokes')
      .where('user', '==', profile.id)
      .get();
    const allJokes: Joke[] = [];
    jokesData.forEach((obj: any) => allJokes.push(obj.data()));
    const allActive = allJokes.filter(
      (j: Joke) => !j.hasOwnProperty('deleted')
    );
    const jokesWithUsers = allActive.map((j: any, i: number) => {
      return { ...j, user: profile, id: jokesData.docs[i].id };
    });
    jokesWithUsers.sort((a: Joke, b: Joke) => {
      if (!b.hasOwnProperty('creationTime')) {
        return -1;
      }
      if (!a.hasOwnProperty('creationTime')) {
        return 1;
      }
      return b.creationTime - a.creationTime;
    });
    return jokesWithUsers;
  }, [profile]);

  const getRating = useCallback(async () => {
    const allLikesA = await db.collection('likes').get();
    let allLikes: any[] = [];
    allLikesA.forEach((l: any) => allLikes.push(l.data()));
    const matchingLikes = allLikes.filter((l: any) => {
      return userJokes.find((j: Joke) => j.id === l.joke) !== undefined;
    });
    let rat = 0;
    matchingLikes.forEach((l: any) => (rat += l.action));
    return rat;
  }, [userJokes]);

  const allProfileFollowers = useCallback(async () => {
    const followesA = await db
      .collection('followers')
      .where('followed', '==', profile.id)
      .where('action', '==', 'follow')
      .get();
    let followers: any[] = [];
    followesA.forEach((f: any) => followers.push(f.data()));
    console.log('followers ', followers)
    setFollowersCount(followers.length);
    return followers;
  }, [profile]);

  const checkFollowed = useCallback(async () => {
    const followers: any[] = await allProfileFollowers();
    if (followers.find((f: any) => f.follower === user.id) !== undefined) {
      setFollowed(true);
    }
    return;
  }, [allProfileFollowers, user]);

  useEffect(() => {
    getAllJokes().then((p: any) => {
      setUserJokes(p);
    });
  }, [user, profile, getAllJokes]);

  useEffect(() => {
    getRating().then((p: any) => setRating(p));
  }, [userJokes, getRating]);

  useEffect(() => {
    checkFollowed();
    // if (user.id !== profile.id) {
    //   checkFollowed();
    // }
  }, [followed, followersCount, profile, user, checkFollowed]);

  async function onFollow(action: string) {
    if (notLogedIn()) {
      return;
    }
    await db
      .collection('followers')
      .doc(`${(user.id||'').toString()} to ${(profile.id||'').toString()}`)
      .set({ follower: user.id, followed: profile.id, action: action });
    setFollowed(!followed);
    return;
  }

  return (
    <Provider>
      <Appbar.Header style={styles.top}>
        <Appbar.BackAction onPress={() => onGoBack()} />
        <Appbar.Content title={profile.name} />
        {user.id !== profile.id ? (
          !followed ? (
            <Button onPress={() => onFollow('follow')} mode="outlined">Follow</Button>
          ) : (
            <Button onPress={() => onFollow('unFollow')} mode="contained">Following</Button>
          )
        ) : (
          <Button
            mode="outlined"
            onPress={async () => {
              await signOut();
              onGoBack();
            }}>
            Sign Out
          </Button>
        )}
      </Appbar.Header>
      <Card>
        <Card.Content style={styles.infoTab}>
          <View style={styles.stat}>
            <Title>{userJokes.length}</Title>
            <Paragraph>Jokes</Paragraph>
          </View>
          <View style={styles.stat}>
            <Title>{rating}</Title>
            <Paragraph>Rating</Paragraph>
          </View>
          <View style={styles.stat}>
            <Title>{followersCount}</Title>
            <Paragraph>Followers</Paragraph>
          </View>
        </Card.Content>
      </Card>
      <ScrollView>
        {userJokes.map((e: any, i: any) => (
          <JokeView
            value={e}
            key={i}
            userNameToIcon={userNameToIcon}
            user={user}
            setScreen={setScreen}
            setProfU={setProfU}
            notLogedIn={notLogedIn}
            reloadPage={async () =>
              setUserJokes(await getAllJokes())
            }></JokeView>
        ))}
      </ScrollView>
    </Provider>
  );
};

export default Profile;

const styles = StyleSheet.create({
  top: {
    backgroundColor: 'white',
  },
  infoTab: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
});
