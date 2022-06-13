import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Joke, User } from '../App';
import {
  Paragraph,
  Appbar,
  TextInput,
  Provider,
  Snackbar,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { db, fs, storage } from '../fireBase';

type Props = {
  onGoBack: Function;
  user: User;
};

const UploadJoke: React.FC<Props> = ({ onGoBack, user }) => {
  const [mainText, setMainText] = useState('');
  const [hiddenText, setHiddenText] = useState('');
  const [image, setImage] = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageFail, setImageFail] = useState(false)
  const [uploadErrorSB, setUploadErrorSB] = useState(false)

  const getImgSize = useCallback((photo) => {
    console.log('@@@ photo ', photo.slice(30))

    if (imageSize.height !== 0) {
      return;
    }
    Image.getSize(
      photo,
      (width, height) => {
        console.log('w,h ', { width, height })
        setImageSize({ width, height });
      },
      () => setImageFail(true)
    );
  },[imageSize])
  
  useEffect(() => {
    if (localPhotoUri !== '') {
      getImgSize(localPhotoUri)
      return
    }
    else if (image !== '') {
      getImgSize(image)
      return
    }
    return
  }, [localPhotoUri, getImgSize, image])

  const { height, width } = Dimensions.get('window');

  async function upload() {
    if (mainText === '' || imageFail) {
      setUploadErrorSB(true)
      return
    }
    let currJoke: Joke = {
      user: user.id||'',
      mainText: mainText,
      creationTime: fs.Timestamp.now(),
    };

    if (hiddenText !== '') {
      currJoke.hiddenText = hiddenText;
    }
    if (image !== '' && localPhotoUri === '') {
      currJoke.image = image;
    }
    const newJoke = await db
      .collection('jokes')
      .add(currJoke)

    if (localPhotoUri !== '') {
      const id = newJoke.id;
      uploadLocalPhoto(localPhotoUri, id)
        .then(() => {
          console.log('SUCCESS');
        })
        .catch((error: any) => {
          console.log('we had an error');
        });
      currJoke.image = `https://firebasestorage.googleapis.com/v0/b/joker-90f14.appspot.com/o/images%2F${id}?alt=media`;
      await db.collection('jokes').doc(id).set(currJoke);
    }
    onGoBack();
    return;
  }

  async function doUplaod() {
    let result = await ImagePicker.launchCameraAsync();
    if (!result.cancelled) {
      setLocalPhotoUri(result.uri);
    }
  }

  async function uploadLocalPhoto(uri: string, jokeId: string) {
    const response = await fetch(uri);
    const blob = await response.blob();

    var ref = storage.ref().child(`images/${jokeId}`);
    return ref.put(blob);
  }

  return (
    <Provider>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => onGoBack()} />
        <Appbar.Content title="Create new joke!" />
        <Appbar.Action icon="send" onPress={() => upload()} />
      </Appbar.Header>
      <ScrollView style={styles.content}>
        <TextInput
          value={mainText}
          onChangeText={(joke: string) => setMainText(joke)}
          multiline
          numberOfLines={3}
          mode="outlined"
          label="Joke!"
          style={styles.input}></TextInput>
        <TextInput
          value={hiddenText}
          onChangeText={(hiddenLine: string) => setHiddenText(hiddenLine)}
          multiline
          numberOfLines={1}
          mode="outlined"
          label="Hidden Punch! (optional)"
          style={styles.input}></TextInput>
        <TextInput
          value={image}
          onChangeText={(image: string) => setImage(image)}
          multiline
          numberOfLines={1}
          mode="outlined"
          label="Image URL (optional)"
          disabled={localPhotoUri !== ''}
          right={
            localPhotoUri === '' ? (
              <TextInput.Icon name="camera" onPress={() => doUplaod()} />
            ) : (
              <TextInput.Icon
                name="close"
                onPress={() => setLocalPhotoUri('')}
              />
            )
          }
          style={styles.input}></TextInput>
        {imageFail ? <Paragraph style={styles.imageError}>Error in image, please replace or remove</Paragraph> : (localPhotoUri !== '' && imageSize.width) ? (
          <>
            <Image
              source={{ uri: localPhotoUri }}
              style={{
                width: width - 14,
                height: (imageSize.height * (width - 14)) / imageSize.width,
                marginTop: 10,
              }}></Image>
          </>
        ) : (image !== '' && imageSize.width) ? (
          <>
            <Image
              source={{ uri: image }}
              style={{
                width: width - 14,
                height: (imageSize.height * (width - 14)) / imageSize.width,
                marginTop: 10,
              }}></Image>
          </>
        ) : null}
      </ScrollView>
      <Snackbar visible={uploadErrorSB} onDismiss={() => setUploadErrorSB(false)}>
        {mainText === '' ? 'You must have Joke in order to upload ' : imageFail ? '\n' : null}
        {imageFail ? 'Error in image, please replace or remove' : ''}
      </Snackbar>
    </Provider>
  );
};

export default UploadJoke;

const styles = StyleSheet.create({
  content: {
    margin: 7,
  },
  input: {
    marginBottom: 2,
  },
  imageError : {
    color: 'red',
  }
});
