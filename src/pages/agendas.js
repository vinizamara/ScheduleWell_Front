import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  TextInput,
  Button,
  Alert,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import { useFonts, SuezOne_400Regular } from "@expo-google-fonts/suez-one";
import * as SplashScreen from "expo-splash-screen";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import sheets from "../axios/axios";

export default function Escolhanotas() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [financas, setFinancas] = useState([]);
  const [anotacoes, setAnotacoes] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [titulos, setTitulos] = useState("");
  const [resultados, setResultados] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  let [fontsLoaded] = useFonts({
    SuezOne_400Regular,
  });

  const checkLoginStatus = async () => {
    try {
      setLoading(true);
      const userLoggedIn = await AsyncStorage.getItem("userLoggedIn");

      if (userLoggedIn === "true") {
        setIsLoggedIn(true);
        const idUsuario = await AsyncStorage.getItem("userId");
        listarFinancas(idUsuario);
        listarAnotacoes(idUsuario);
        listarChecklists(idUsuario);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Erro ao verificar o login:", error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const listarFinancas = async (idUsuario) => {
    try {
      const response = await sheets.listarFinancas(idUsuario);
      setFinancas(response.data);
    } catch (error) {
      console.log(
        "Erro ao buscar finanças:",
        error.response?.data?.message
      );

      setFinancas([]);
    }
  };

  const listarAnotacoes = async (idUsuario) => {
    try {
      const response = await sheets.getNota(idUsuario);
      setAnotacoes(response.data);
    } catch (error) {
      console.log(
        "Erro ao buscar notas:",
        error.response?.data?.message
      );

      setAnotacoes([]);
    }
  };

  const listarChecklists = async (idUsuario) => {
    try {
      const response = await sheets.getChecklists(idUsuario);
      setChecklists(response.data);
    } catch (error) {
      console.log(
        "Erro ao buscar checklists:",
        error.response?.data?.message
      );

      setChecklists([]);
    }
  };

  const TitulosSemelhantes = async (titulo) => {
    try {
      const idUsuario = await AsyncStorage.getItem("userId");
      console.log(titulo);
      console.log(idUsuario);
      const response = await sheets.buscarTitulosSemelhantes(idUsuario, titulo);
      console.log(response.data);
      setResultados(response.data.resultados);
    } catch (error) {
      console.log("Erro ao buscar titulos:", error.response.data.message);
    }
  };

  useEffect(() => {
    console.log("Resultados atualizados:", resultados);
  }, [resultados]);

  useEffect(() => {
    if (isFocused) {
      checkLoginStatus();
    }
  }, [isFocused]);

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const handlePlusPress = () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Faça Login",
        "Você precisa fazer login para criar uma nova nota. Deseja fazer login agora?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login") },
        ]
      );
    } else {
      navigation.navigate("Escolhanotas");
    }
  };

  const handleNewButton = () => {
    navigation.navigate("Controlefinanceiro");
  };

  const handleProfilePage = () => {
    navigation.navigate("Paginadeperfil");
  };

  const handleEditFinanca = (idFinanca) => {
    navigation.navigate("EditarFinanca", { id: idFinanca }); // Passando o ID da finança
  };

  const handleEditAnotacao = (idAnotacao) => {
    navigation.navigate("EditarAnotacao", { id: idAnotacao }); // Passando o ID da finança
  };

  const handleEditChecklist = (idChecklist) => {
    navigation.navigate("EditarChecklist", { id: idChecklist }); // Passando o ID da finança
  };

  const handleDeleteItem = async (id, type) => {
    let deleteFunction;
    let setStateFunction;
    let campoId;

    switch (type) {
      case "financa":
        deleteFunction = sheets.deletarFinanca;
        setStateFunction = setFinancas;
        campoId = "id_financa";
        break;

      case "anotacao":
        deleteFunction = sheets.deleteNota;
        setStateFunction = setAnotacoes;
        campoId = "id_anotacao";
        break;

      case "checklist":
        deleteFunction = sheets.deleteChecklist;
        setStateFunction = setChecklists;
        campoId = "id_checklist";
        break;

      default:
        console.error("Tipo inválido:", type);
        return;
    }

    Alert.alert(
      `Deletar ${type}`,
      `Tem certeza que deseja deletar essa ${type}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },

        {
          text: "Deletar",

          onPress: async () => {
            try {
              await deleteFunction(id);

              const idUsuario =
                await AsyncStorage.getItem(
                  "userId"
                );

              await listarFinancas(idUsuario);

              await listarAnotacoes(idUsuario);

              await listarChecklists(idUsuario);

              setResultados((prevResultados) =>
                prevResultados.filter(
                  (item) => item.id !== id
                )
              );

              Alert.alert(
                "Sucesso",
                `${type} deletada com sucesso.`
              );
            } catch (error) {
              console.error(
                `Erro ao deletar ${type}:`,
                error
              );

              Alert.alert(
                "Erro",
                `Erro ao deletar ${type}.`
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.notesText}>Suas Notas</Text>

      {/* Botão "+" centralizado na parte inferior */}
      <View style={styles.plusButtonContainer}>
        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => {
            setTitulos("");
            setResultados([]);
            setModalVisible(true);
          }}
        >
          <Icon name="search" size={30} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.plusButton} onPress={handlePlusPress}>
          <Icon name="plus" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Exibição de Finanças */}
        {financas.length > 0 && (
          <>
            <Text style={styles.sectionTitleTop}>Finanças</Text>
            {financas.map((financa) => (
              <TouchableOpacity
                key={financa.id_financa}
                style={styles.financaContainer}
                onPress={() =>
                  navigation.navigate("EditarFinanca", {
                    id: financa.id_financa,
                  })
                }
              >
                <Text style={styles.financaText}>{financa.titulo}</Text>
                <View style={styles.iconContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      handleDeleteItem(financa.id_financa, "financa")
                    }
                  >
                    <Icon name="trash" size={28} color="#EC4E4E" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Exibição de Anotações */}
        {anotacoes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Anotações</Text>
            {anotacoes.map((anotacao) => (
              <TouchableOpacity
                key={anotacao.id_anotacao}
                style={styles.financaContainer}
                onPress={() =>
                  navigation.navigate("EditarAnotacao", {
                    id: anotacao.id_anotacao,
                  })
                }
              >
                <Text style={styles.financaText}>{anotacao.titulo}</Text>
                <View style={styles.iconContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      handleDeleteItem(anotacao.id_anotacao, "anotacao")
                    }
                  >
                    <Icon name="trash" size={28} color="#EC4E4E" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Exibição de Checklists */}
        {checklists.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Checklists</Text>
            {checklists.map((checklist) => (
              <TouchableOpacity
                key={checklist.id_checklist}
                style={styles.financaContainer}
                onPress={() => handleEditChecklist(checklist.id_checklist)}
              >
                <Text style={styles.financaText}>{checklist.titulo}</Text>
                <View style={styles.iconContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      handleDeleteItem(checklist.id_checklist, "checklist")
                    }
                  >
                    <Icon name="trash" size={28} color="#EC4E4E" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {financas.length === 0 &&
          anotacoes.length === 0 &&
          checklists.length === 0 && (
            <Text style={styles.batataText}>
              Você ainda não possui nenhuma anotação criada
            </Text>
          )}

        {/* Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>

              <Text style={styles.modalTitle}>
                Pesquisar Transações
              </Text>

              <TextInput
                value={titulos}
                onChangeText={setTitulos}
                placeholder="Digite o título"
                placeholderTextColor="#777"
                style={styles.searchInput}
              />

              <TouchableOpacity
                style={styles.searchButtonModal}
                onPress={() => TitulosSemelhantes(titulos)}
              >
                <Text style={styles.searchButtonText}>
                  Buscar
                </Text>
              </TouchableOpacity>

              {/* Resultados */}
              {resultados.length > 0 ? (
                <ScrollView style={styles.resultsContainer}>
                  {resultados.map((resultado, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.resultItem}
                      onPress={() => {
                        if (resultado.tipo === "financa") {
                          navigation.navigate("EditarFinanca", { id: resultado.id });
                        } else if (resultado.tipo === "anotacao") {
                          navigation.navigate("EditarAnotacao", { id: resultado.id });
                        } else if (resultado.tipo === "checklist") {
                          navigation.navigate("EditarChecklist", { id: resultado.id });
                        }

                        setModalVisible(false);
                      }}
                    >
                      <Text style={styles.resultText}>
                        {resultado.titulo}
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          handleDeleteItem(resultado.id, resultado.tipo);
                          setModalVisible(false);
                        }}
                      >
                        <Icon name="trash" size={22} color="#EC4E4E" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noResultsText}>
                  Nenhum resultado encontrado
                </Text>
              )}

              <TouchableOpacity
                style={styles.searchButtonModal}
                onPress={() => {
                  setModalVisible(false);
                  setTitulos("");
                  setResultados([]);
                }}
              >
                <Text style={styles.searchButtonText}>
                  Fechar
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E2EDF2",
    paddingHorizontal: 20,
  },

  notesText: {
    fontSize: 24,
    color: "#255573",
    fontFamily: "SuezOne_400Regular",
    alignSelf: "center",
    marginTop: 20,
  },

  financaContainer: {
    backgroundColor: "#C6DBE4",
    padding: 15,
    borderRadius: 10,
    marginTop: "3%",
    marginBottom: "5%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  financaText: {
    color: "#255573",
    fontSize: 18,
    fontFamily: "SuezOne_400Regular",
  },

  iconContainer: {
    flexDirection: "row",
    gap: 25,
  },

  batataText: {
    textAlign: "center",
    fontSize: 25,
    color: "#255573",
    marginTop: "20%",
    fontFamily: "SuezOne_400Regular",
  },

  sectionTitle: {
    fontFamily: "SuezOne_400Regular",
    fontSize: 25,
    color: "#255573",
    marginTop: 20,
    marginBottom: 0,
  },

  sectionTitleTop: {
    fontFamily: "SuezOne_400Regular",
    fontSize: 25,
    color: "#255573",
    marginTop: 0,
    marginBottom: 0,
  },

  plusButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#E2EDF2",
  },

  plusButton: {
    backgroundColor: "#1F74A7",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonContainer: {
    backgroundColor: "#EC4E4E",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    flex: 1,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: "10%",
  },

  footerText: {
    color: "#FFF",
    fontSize: 18,
    textAlign: "center",
  },

  saveButton: {
    backgroundColor: "#1F74A7",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },

  anotacaoContainer: {
    backgroundColor: "#C6DBE4",
    padding: 15,
    borderRadius: 10,
    marginTop: "3%",
    marginBottom: "5%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  anotacaoText: {
    color: "#255573",
    fontSize: 18,
    fontFamily: "SuezOne_400Regular",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
  },

  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },

  modalTitle: {
    fontSize: 20,
    color: "#255573",
    fontFamily: "SuezOne_400Regular",
    marginBottom: 16,
    textAlign: "center",
  },

  searchInput: {
    backgroundColor: "#E2EDF2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#255573",
    borderWidth: 1,
    borderColor: "#B5CDD8",
    marginBottom: 16,
  },

  searchButtonModal: {
    backgroundColor: "#1F74A7",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },

  searchButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  resultsContainer: {
    maxHeight: 300,
  },

  resultItem: {
    backgroundColor: "#C6DBE4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resultText: {
    fontSize: 16,
    color: "#255573",
    fontFamily: "SuezOne_400Regular",
    maxWidth: "80%",
  },

  noResultsText: {
    textAlign: "center",
    color: "#255573",
    fontSize: 16,
    marginVertical: 20,
  },
});
