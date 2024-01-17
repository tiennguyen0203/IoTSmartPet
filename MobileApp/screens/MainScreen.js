import { View, Text, Image, SafeAreaView, TextInput, TouchableOpacity, StyleSheet, ScrollView, ToastAndroid, Platform, Alert } from 'react-native'
import { React, useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { database } from './firebaseConfig';
import { ref, onValue, set, off, get, update } from "firebase/database";

export default function LoginScreen() {
    const navigation = useNavigation();

    const [data, setData] = useState({
        FbFeedState: 0,
        FbFoodWeight: 0,
        FbPumpState: 0,
        FbWaterLevel: 0,
        FoodHis: {},
        WaterHis: {},
    });
    
    useEffect(() => {
        const databaseRef = ref(database); // Reference to the root of the database
    
        // Attach an asynchronous callback to read the data
        const fetchData = (snapshot) => {
            const val = snapshot.val();
            setData(val);
        };
    
        // Attach the event listener
        onValue(databaseRef, fetchData);
    
        // Detach the callback when the component unmounts
        return () => {
            // Detach the event listener
            off(databaseRef, 'value', fetchData);
        };
    }, []);

    const notifyUser = (title, message) => {
        if (Platform.OS === 'android') {
          // For Android
          ToastAndroid.showWithGravityAndOffset(
            message,
            ToastAndroid.LONG,
            ToastAndroid.BOTTOM,
            25,
            50
          );
        } else {
          // For iOS and potentially other platforms
          Alert.alert(title, message);
        }
    };

    const updateFbFeedState = () => {
        const databaseRef = ref(database);
    
        // Assuming 'FbFeedState' is a key in your database
        const newFbFeedState = data.FbFeedState === 1 ? 0 : 1;
        
        set(databaseRef, {
            ...data, // Keep existing data
            FbFeedState: newFbFeedState,
        });

        // Check if FoodHis exists in the database
        const foodHisRef = ref(database, 'FoodHis');
        get(foodHisRef)
            .then((snapshot) => {
                const currentDate = new Date().toLocaleString('en-CA', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                });

                let newFoodHis;

                if (snapshot.exists()) {
                    // FoodHis already exists, update dates
                    newFoodHis = { ...snapshot.val() };
                    newFoodHis.date3 = newFoodHis.date2;
                    newFoodHis.date2 = newFoodHis.date1;
                    newFoodHis.date1 = currentDate;
                } else {
                    // FoodHis doesn't exist, create it with current date
                    newFoodHis = {
                        date1: currentDate,
                        date2: null, // Set to default value or handle as needed
                        date3: null, // Set to default value or handle as needed
                    };
                }

                // Update FoodHis with the modified or new dates
                update(foodHisRef, newFoodHis);
            })
            .catch((error) => {
                console.error('Error updating FoodHis:', error);
            });
        
        notifyUser('Feeding Successful', 'You have successfully feeding');
    };

    const updateFbWaterLevel = () => {
        const databaseRef = ref(database);
    
        // Assuming 'FbPumpState' is a key in your database
        const newFbWaterLevel = data.FbPumpState === 1 ? 0 : 1;
    
        // Update FbPumpState
        set(databaseRef, {
            ...data, // Keep existing data
            FbPumpState: newFbWaterLevel,
        });
    
        // Assuming 'WaterHis' is an array in your database
        const waterHisRef = ref(database, 'WaterHis');
        const currentDate = new Date().toLocaleString('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    
        get(waterHisRef)
            .then((snapshot) => {
                let newWaterHis;
    
                if (snapshot.exists()) {
                    // WaterHis already exists, update levels
                    newWaterHis = { ...snapshot.val() };
                    newWaterHis.date3 = newWaterHis.date2;
                    newWaterHis.date2 = newWaterHis.date1;
                    newWaterHis.date1 = currentDate;
                } else {
                    // WaterHis doesn't exist, create it with current level
                    newWaterHis = {
                        date1: currentDate,
                        date2: null, // Set to default value or handle as needed
                        date3: null, // Set to default value or handle as needed
                    };
                }
    
                // Update WaterHis with the modified or new levels
                update(waterHisRef, newWaterHis);
            })
            .catch((error) => {
                console.error('Error updating WaterHis:', error);
            });
        
        notifyUser('Watering Successful', 'You have successfully watering');
    };    
    
    return (
        
        <View className="bg-white h-full w-full">
            
            <StatusBar style="light" />
            <Image className="h-full w-full absolute" source={require('../assets/images/background.png')} />

            
            <ScrollView className="p-5">
                <View className="h-full w-full flex justify-around">
                    
                    <View className="flex items-center mx-5 my-10">
                        <Animated.Text 
                            entering={FadeInUp.duration(1000).springify()} 
                            className="text-white font-bold tracking-wider text-4xl">
                                Smart Pet Container
                        </Animated.Text>

                        <View style={styles.container}>
                            <View style={styles.column}>
                                <Text>Food: {data.FbFoodWeight}</Text>
                            </View>
                            <View style={styles.column}>
                                <Text>Water level: {data.FbWaterLevel}</Text>
                            </View>
                        </View>

                    </View>

                    <View className="flex mx-5 space-y-4">
                        
                        <View style={styles.h_container}>
                            <Text style={styles.innerText}>Food History:</Text>
                            {Object.keys(data.FoodHis).map((key) => (
                                <Text style={styles.textContainer} key={key}>{key}: {data.FoodHis[key]}</Text>
                            ))}
                        </View>

                        <View style={styles.h_container}>
                            <Text style={styles.innerText}>Water History:</Text>
                            {Object.keys(data.WaterHis).map((key) => (
                                <Text style={styles.textContainer} key={key}>{key}: {data.WaterHis[key]}</Text>
                            ))}
                        </View>

                        <Animated.View 
                            className="w-full" 
                            entering={FadeInDown.delay(400).duration(1000).springify()}>

                            <TouchableOpacity 
                                className="w-full bg-sky-400 p-3 rounded-2xl mb-3"
                                onPress={updateFbFeedState}    
                            >
                                <Text className="text-xl font-bold text-white text-center">Feed</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View 
                            className="w-full my-10" 
                            entering={FadeInDown.delay(400).duration(1000).springify()}>

                            <TouchableOpacity 
                                className="w-full bg-sky-400 p-3 rounded-2xl mb-3"
                                onPress={updateFbWaterLevel}    
                            >
                                <Text className="text-xl font-bold text-white text-center">Water</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                    
                    
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row', // This makes the container a row
        justifyContent: 'space-between', // This places columns at each end of the row
        padding: 8,
        margin: 4,
        marginTop: 20,
    },
    column: {   
        flex: 1, // This makes each column take equal width
        backgroundColor: 'lightgray',
        padding: 16,
        margin: 4,
        borderRadius: 8,
    },
    textContainer: {
        color: 'black',
        backgroundColor: "white",
        padding: 8,
        borderRadius: 8,
        margin: 4,
    },
    h_container: {
        backgroundColor: "#48BBDB",
        padding: 10,
        borderRadius: 8,
    },
    innerText: {
        color: 'black',
        fontWeight: 'bold'
    },
});