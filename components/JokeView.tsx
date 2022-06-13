import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Image,
  Dimensions,
  Share,
} from 'react-native';
import { Joke, User } from '../App';
import {
  Card,
  Paragraph,
  Button,
  Title,
  Avatar,
  IconButton,
  Menu,
} from 'react-native-paper';
import {
  Ionicons,
  AntDesign,
  FontAwesome,
} from '@expo/vector-icons';

import { db } from '../fireBase';

type Props = {
  value: Joke;
  userNameToIcon: Function;
  user: User;
  setScreen: Function;
  setProfU: Function;
  notLogedIn: Function;
  reloadPage: Function;
};

const JokeView: React.FC<Props> = ({
  value,
  userNameToIcon,
  user,
  setScreen,
  setProfU,
  notLogedIn,
  reloadPage,
}) => {
  const [hiddenLineShowed, setHiddenLineShowed] = useState(false);
  const [rating, setRating] = useState('none'); // none or liked or disLiked
  const [save, setSave] = useState(false);
  const [likes, setLikes] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 323, height: 195 });

  useEffect(() => {
    async function getLikes() {
      const DBLikes = (await db.collection('likes').get()).docs.map((l: any) =>
        l.data()
      );
      const allLikes = DBLikes.filter((l: any) => l.joke === value.id);
      const matchingLike = allLikes.find((l: any) => l.user === user.id);
      if (matchingLike !== undefined) {
        if (matchingLike.action === 1) {
          setRating('liked');
        } else if (matchingLike.action === -1) {
          setRating('disLiked');
        } else {
          setRating('none');
        }
      } else {
        setRating('none');
      }
      let likesAmount = 0;
      allLikes.forEach((l: any) => (likesAmount += l.action));
      setLikes(likesAmount);
    }
    getLikes();
  }, [user, value]);

  useEffect(() => {
    async function getSaved() {
      if (user.id === '-1') {
        setSave(false);
        return;
      }
      const saved = (
        await db
          .collection('saved')
          .where('post', '==', value.id)
          .where('user', '==', user.id)
          .get()
      ).docs[0];
      if (saved === undefined) {
        setSave(false);
        return;
      }
      setSave(!!saved);
      return;
    }
    getSaved();
  }, [user, value]);

  useEffect(() => {
    if (value.hasOwnProperty('image')) {
      Image.getSize(value.image||'', (width: number, height: number) =>
        setImageSize({ width, height })
      );
    }
  }, [value]);

  const LeftIconButton = (props: any) => {
    return (
      <IconButton
        {...props}
        icon={LeftContent}
        onPress={() => {
          setProfU(value.user);
          setScreen('profile');
        }}
        style={styles.l}
      />
    );
  };
  const LeftContent = (props: any) => {
    return (
      <Avatar.Text
        {...props}
        label={userNameToIcon((value.user as User).name)}
        color="white"
      />
    );
  };
  const RightContent = (props: any) => (
    <Menu
      visible={showMenu}
      onDismiss={() => setShowMenu(false)}
      style={styles.menu}
      anchor={
        <IconButton
          {...props}
          icon="dots-vertical"
          onPress={() => setShowMenu(true)}
        />
      }>
      <Menu.Item
        icon={(props: any) => <Ionicons {...props} name="person" />}
        onPress={() => {
          setProfU(value.user);
          setScreen('profile');
        }}
        title="Go to profile"
      />
      {user.id === (value.user as User).id ? (
        <Menu.Item
          icon={(props: any) => <FontAwesome {...props} name="trash-o" />}
          onPress={async () => await deleteJoke()}
          title="Delete Joke"
        />
      ) : null}
    </Menu>
  );

  const LikeButtonIcon = (props: any) => {
    if (rating === 'liked') {
      return <AntDesign {...props} color="#6200ee" name="like1" />;
    }
    return <AntDesign {...props} color="#6200ee" name="like2" />;
  };

  const DisLikeButtonIcon = (props: any) => {
    if (rating === 'disLiked') {
      return <AntDesign {...props} color="#6200ee" name="dislike1" />;
    }
    return <AntDesign {...props} color="#6200ee" name="dislike2" />;
  };

  const SaveButtonIcon = (props: any) => {
    if (save) {
      return <FontAwesome {...props} color="#6200ee" name="bookmark" />;
    }
    return <FontAwesome {...props} color="#6200ee" name="bookmark-o" />;
  };

  function createStringToShare() {
    let str = value.mainText;
    if (value.hiddenText !== undefined) {
      str += '\n\n\n';
      str += value.hiddenText;
    }
    if (value.image !== undefined) {
      str += '\n\n';
      str += value.image;
    }
    str += '\n\n Why so serious? Joker (;';
    return str;
  }

  async function deleteJoke() {
    const thisJoke = await db.collection('jokes').doc(value.id).get();
    const deleted = await db
      .collection('jokes')
      .doc(value.id)
      .set({ ...thisJoke.data(), deleted: true });
    setShowMenu(false);
    reloadPage();
    return;
  }

  const onShare = async () => {
    try {
      const result = await Share.share(
        {
          title: (value.user as User).name,
          message: createStringToShare(),
        },
        { dialogTitle: 'Share Joke' }
      );
    } catch (error: any) {
      console.log('shareError ', error.message);
    }
  };

  function timestampToString() {
    const now = Date.now();
    const postTime: number = value.creationTime.toMillis();
    if (now - postTime < 1000 * 60) {
      return 'now';
    }
    if (now - postTime < 1000 * 60 * 60) {
      if (Math.floor((now - postTime) / (60 * 1000)) === 1) {
        return '1 minute ago';
      }
      return Math.floor((now - postTime) / (60 * 1000)) + ' minutes ago';
    }
    if (now - postTime < 1000 * 60 * 60 * 24) {
      if (Math.floor((now - postTime) / (60 * 1000 * 60)) === 1) {
        return '1 hour ago';
      }
      return Math.floor((now - postTime) / (60 * 1000 * 60)) + ' hours ago';
    }
    if (now - postTime < 1000 * 60 * 60 * 24 * 7) {
      if (Math.floor((now - postTime) / (60 * 1000 * 60 * 24)) === 1) {
        return '1 day ago';
      }
      return Math.floor((now - postTime) / (60 * 1000 * 60 * 24)) + ' days ago';
    }
    if (now - postTime < 1000 * 60 * 60 * 24 * 30) {
      if (Math.floor((now - postTime) / (60 * 1000 * 60 * 24 * 7)) === 1) {
        return '1 week ago';
      }
      return (
        Math.floor((now - postTime) / (60 * 1000 * 60 * 24 * 7)) + ' weeks ago'
      );
    }
    if (now - postTime < 1000 * 60 * 60 * 24 * 365) {
      if (Math.floor((now - postTime) / (60 * 1000 * 60 * 24 * 30)) === 1) {
        return '1 month ago';
      }
      return (
        Math.floor((now - postTime) / (60 * 1000 * 60 * 24 * 30)) +
        ' months ago'
      );
    } else {
      if (Math.floor((now - postTime) / (60 * 1000 * 60 * 24 * 365)) === 1) {
        return '1 year ago';
      }
      return (
        Math.floor((now - postTime) / (60 * 1000 * 60 * 24 * 365)) +
        ' years ago'
      );
    }
  }

  async function like(action: number) {
    await db
      .collection('likes')
      .doc(`${(user.id||'').toString()} to ${(value.id||'').toString()}`)
      .set({
        user: user.id,
        joke: value.id,
        action: action,
      });
  }

  async function onLike() {
    if (notLogedIn()) {
      return;
    }
    if (rating === 'disLiked') {
      setLikes(likes + 2);
      setRating('liked');
      like(1);
      return;
    }
    if (rating === 'none') {
      setLikes(likes + 1);
      setRating('liked');
      like(1);
      return;
    }

    if (rating === 'liked') {
      setLikes(likes - 1);
      setRating('none');
      like(0);
      return;
    }
  }

  function onDisLike() {
    if (notLogedIn()) {
      return;
    }
    if (rating === 'liked') {
      setLikes(likes - 2);
      setRating('disLiked');
      like(-1);
      return;
    }
    if (rating === 'none') {
      setLikes(likes - 1);
      setRating('disLiked');
      like(-1);
      return;
    }

    if (rating === 'disLiked') {
      setLikes(likes + 1);
      setRating('none');
      like(0);
      return;
    }
  }

  async function onSave(action: boolean) {
    if (notLogedIn()) {
      return;
    }
    await db
      .collection('saved')
      .doc(`${(user.id||'').toString()} to ${(value.id||'').toString()}`)
      .set({ user: user.id, post: value.id, action: action });
    setSave(!save);
    return;
  }

  function choseSizeToImage() {
    return {
      width: Dimensions.get('window').width - 10,
      height:
        (imageSize.height * (Dimensions.get('window').width - 10)) /
        imageSize.width,
    };
  }

  return (
    <Card style={styles.card}>
      <Card.Title
        title={(value.user as User).name}
        subtitle={value.creationTime !== undefined ? timestampToString() : null}
        left={LeftIconButton}
        right={RightContent}
      />
      <Card.Content style={styles.jokeText}>
        <Title>{value.mainText}</Title>
        {value.hasOwnProperty('hiddenText') ? (
          <>
            <Button
              onPress={() => setHiddenLineShowed(!hiddenLineShowed)}
              mode="contained"
              style={styles.showPunch}>
              {hiddenLineShowed ? 'un-punch' : 'punch'}
            </Button>
            <Title>{hiddenLineShowed ? value.hiddenText : ' '}</Title>
          </>
        ) : null}
      </Card.Content>
      {value.hasOwnProperty('image') ? (
        <Card.Cover
          source={{
            uri: value.image,
          }}
          style={choseSizeToImage()}
        />
      ) : null}
      <Card.Actions>
        <IconButton icon={LikeButtonIcon} onPress={() => onLike()} />
        <Paragraph style={styles.likesAmount}>{likes}</Paragraph>
        <IconButton icon={DisLikeButtonIcon} onPress={() => onDisLike()} />
        <IconButton
          icon={SaveButtonIcon}
          onPress={() => onSave(!save)}
          style={styles.rightButtons}
        />
        <IconButton
          icon={(props: any) => (
            <AntDesign {...props} color="#6200ee" name="sharealt" />
          )}
          onPress={async () => await onShare()}
        />
      </Card.Actions>
    </Card>
  );
};

export default JokeView;

const styles = StyleSheet.create({
  showPunch: {
    width: 150,
  },
  card: {
    margin: 4,
    borderWidth: 1,
  },
  jokeText: {
    margin: 5,
  },
  likesAmount: {
    margin: 2,
  },
  rightButtons: {
    marginLeft: 'auto',
  },
  menu: {
    marginLeft: 'auto',
  },
  l: {
    marginLeft: -8,
  },
});
