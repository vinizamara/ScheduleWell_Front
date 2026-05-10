import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useFonts, SuezOne_400Regular } from "@expo-google-fonts/suez-one";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import AsyncStorage from "@react-native-async-storage/async-storage";
import sheets from "../axios/axios";

export default function PerfilUsuario() {
  const navigation = useNavigation();

  const [modalProfileVisible, setModalProfileVisible] = useState(false);
  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);

  const [userDefault, setUserDefault] = useState({
    nome: "",
    email: "",
    senha: "",
  });

  const [user, setUser] = useState(userDefault);
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  let [fontsLoaded] = useFonts({
    SuezOne_400Regular,
  });

  async function loadUserData() {
    await SplashScreen.preventAutoHideAsync();

    const userName = await AsyncStorage.getItem("userName");
    const userEmail = await AsyncStorage.getItem("userEmail");

    if (userName && userEmail) {
      setUser({ nome: userName, email: userEmail });
    }

    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }

  useEffect(() => {
    loadUserData();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1F74A7" />
      </View>
    );
  }

  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const handleSaveProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await sheets.updateUser(userId, user);

      Alert.alert("Sucesso", response.data.message);

      await AsyncStorage.setItem("userName", user.nome);
      await AsyncStorage.setItem("userEmail", user.email);

      setModalProfileVisible(false);
    } catch (error) {
      Alert.alert(
        "Atenção",
        error.response?.data?.error || "Erro ao atualizar perfil"
      );
    }
  };

  const handleSavePassword = async () => {
    if (user.senha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não coincidem");
      return;
    }

    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await sheets.updateUser(userId, {
        senha: user.senha,
      });

      Alert.alert("Sucesso", response.data.message);

      setModalPasswordVisible(false);
      setConfirmarSenha("");
    } catch (error) {
      Alert.alert(
        "Atenção",
        error.response?.data?.error || "Erro ao atualizar senha"
      );
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate("PageInit");
  };

  const handleDeleteAccount = async () => {
    const confirm = await new Promise((resolve) => {
      Alert.alert(
        "Confirmar Exclusão",
        "Tem certeza de que deseja deletar sua conta?",
        [
          { text: "Cancelar", onPress: () => resolve(false), style: "cancel" },
          { text: "Deletar", onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirm) return;

    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await sheets.deleteUser(userId);

      Alert.alert("Sucesso", response.data.message);

      await AsyncStorage.clear();
      navigation.navigate("PageInit");
    } catch (error) {
      Alert.alert(
        "Atenção",
        error.response?.data?.error || "Erro ao deletar conta"
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>

        <Image
          source={require("../../assets/icons/perfil.png")}
          style={styles.profileImage}
        />

        <Animatable.Text animation="fadeInDown" style={styles.title}>
          Olá, {user.nome || "Usuário"}
        </Animatable.Text>

        <Text style={styles.subtitle}>{user.email}</Text>

        <View style={styles.sectionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setModalProfileVisible(true)}
          >
            <Text style={styles.buttonText}>Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setModalPasswordVisible(true)}
          >
            <Text style={styles.buttonText}>Alterar Senha</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>Sair</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.buttonText}>Deletar Conta</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL PERFIL */}
      <Modal transparent visible={modalProfileVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={user.nome}
              onChangeText={(text) => setUser({ ...user, nome: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={user.email}
              onChangeText={(text) => setUser({ ...user, email: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalProfileVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL SENHA */}
      <Modal transparent visible={modalPasswordVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alterar Senha</Text>

            <TextInput
              style={styles.input}
              placeholder="Nova senha"
              secureTextEntry
              value={user.senha}
              onChangeText={(text) => setUser({ ...user, senha: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              secureTextEntry
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSavePassword}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalPasswordVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#E2EDF2",
    padding: 20,
    alignItems: "center",
  },

  profileCard: {
    width: "100%",
    backgroundColor: "#C6DBE4",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 4,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 12,
  },

  title: {
    fontSize: 22,
    color: "#255573",
    fontFamily: "SuezOne_400Regular",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#255573",
    marginBottom: 15,
  },

  sectionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  primaryButton: {
    backgroundColor: "#1F74A7",
    padding: 10,
    borderRadius: 10,
    flex: 1,
  },

  secondaryButton: {
    backgroundColor: "#255573",
    padding: 10,
    borderRadius: 10,
    flex: 1,
  },

  dangerButton: {
    backgroundColor: "#EC4E4E",
    padding: 10,
    borderRadius: 10,
    flex: 1,
  },

  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    color: "#255573",
    marginBottom: 15,
    fontFamily: "SuezOne_400Regular",
  },

  input: {
    borderWidth: 1,
    borderColor: "#B5CDD8",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#E2EDF2",
  },

  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  saveButton: {
    backgroundColor: "#1F74A7",
    flex: 1,
    padding: 10,
    borderRadius: 10,
  },

  cancelButton: {
    backgroundColor: "#EC4E4E",
    flex: 1,
    padding: 10,
    borderRadius: 10,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E2EDF2",
  },
});