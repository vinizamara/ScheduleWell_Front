import React, { useState } from "react";

import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";

import {
  useFonts,
  SuezOne_400Regular,
} from "@expo-google-fonts/suez-one";

import {
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";

import * as Animatable from "react-native-animatable";

import sheets from "../axios/axios";

import Icon from "react-native-vector-icons/FontAwesome";

import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ControleFinanceiro() {
  const navigation = useNavigation();

  const [rendaTotal, setRendaTotal] =
    useState("");

  const [despesaMensal, setDespesaMensal] =
    useState("");

  const [receitaMensal, setReceitaMensal] =
    useState("");

  const [saldo, setSaldo] = useState("");

  const [transacoes, setTransacoes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [filtroTipo, setFiltroTipo] =
    useState("Todos");

  const [filtroPeriodo, setFiltroPeriodo] =
    useState("Todos");

  const [modalPesquisaVisible, setModalPesquisaVisible] =
    useState(false);

  const [textoPesquisa, setTextoPesquisa] =
    useState("");

  let [fontsLoaded] = useFonts({
    SuezOne_400Regular,
  });

  const fetchData = async () => {
    setLoading(true);

    try {
      const id = await AsyncStorage.getItem(
        "userId"
      );

      try {
        const financeiroResponse =
          await sheets.resumoFinanceiro(id);

        console.log(
          "financeiroResponse:",
          financeiroResponse.data
        );

        const financeiroData =
          financeiroResponse.data;

        setDespesaMensal(
          financeiroData.despesas?.toString() ||
            "0"
        );

        setReceitaMensal(
          financeiroData.receitas?.toString() ||
            "0"
        );

        setSaldo(
          financeiroData.saldo?.toString() ||
            "0"
        );
      } catch (error) {
        console.log(
          "Erro ao buscar os dados financeiros:",
          error.response?.data?.message
        );

        setDespesaMensal("0");
        setReceitaMensal("0");
        setSaldo("0");
      }

      try {
        const rendaTotalResponse =
          await sheets.obterRendaTotal(id);

        console.log(
          "rendaTotalResponse:",
          rendaTotalResponse.data
        );

        const rendaTotalData =
          rendaTotalResponse.data;

        setRendaTotal(
          rendaTotalData.renda_total?.toString() ||
            "0"
        );
      } catch (error) {
        console.log(
          "Erro ao buscar renda total:",
          error.response?.data?.message
        );

        setRendaTotal("0");
      }

      try {
        const transacoesResponse =
          await sheets.transacoes(id);

        console.log(
          "transacoesResponse:",
          transacoesResponse.data
        );

        const transacoesData =
          transacoesResponse.data;

        setTransacoes(
          Array.isArray(
            transacoesData.transacoes
          )
            ? transacoesData.transacoes
            : []
        );
      } catch (error) {
        console.log(
          "Erro ao buscar transações:",
          error.response?.data?.message
        );

        setTransacoes([]);
      }
    } catch (error) {
      console.log(
        "Erro geral no fetchData:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

useFocusEffect(
  React.useCallback(() => {
    console.log(
      "TELA CONTROLE FINANCEIRO RECEBEU FOCO"
    );

    fetchData();
  }, [])
);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const carregarDados = async () => {
        if (isActive) {
          await fetchData();
        }
      };

      carregarDados();

      return () => {
        isActive = false;
      };
    }, [])
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2196F3"
        />
      </View>
    );
  }

  const AnimatableText =
    Animatable.createAnimatableComponent(
      Text
    );

  const handleEditFinanca = (
    idFinanca
  ) => {
    navigation.navigate("EditarFinanca", {
      id: idFinanca,
    });
  };

  const handleDeleteFinanca = async (
    idFinanca
  ) => {
    Alert.alert(
      "Deletar Finança",
      "Tem certeza que deseja deletar esta transação?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },

        {
          text: "Deletar",
          style: "destructive",

          onPress: async () => {
            try {
              await sheets.deletarFinanca(
                idFinanca
              );

              await fetchData();
              setTextoPesquisa("");

              Alert.alert(
                "Sucesso",
                "Transação deletada com sucesso."
              );
            } catch (error) {
              console.log(
                "Erro ao deletar transação:",
                error.response?.data
                  ?.message
              );

              Alert.alert(
                "Erro",
                "Não foi possível deletar a transação."
              );
            }
          },
        },
      ]
    );
  };

  const transacoesFiltradas =
    transacoes.filter((transacao) => {
      const dataTransacao = new Date(
        transacao.data
      );

      const hoje = new Date();

      const tipoValido =
        filtroTipo === "Todos" ||
        transacao.tipo_transacao ===
          filtroTipo;

      let periodoValido = true;

      if (filtroPeriodo === "Hoje") {
        periodoValido =
          dataTransacao.toDateString() ===
          hoje.toDateString();
      }

      if (filtroPeriodo === "7 Dias") {
        const seteDiasAtras = new Date();

        seteDiasAtras.setDate(
          hoje.getDate() - 7
        );

        periodoValido =
          dataTransacao >= seteDiasAtras;
      }

      if (filtroPeriodo === "30 Dias") {
        const trintaDiasAtras = new Date();

        trintaDiasAtras.setDate(
          hoje.getDate() - 30
        );

        periodoValido =
          dataTransacao >=
          trintaDiasAtras;
      }

      const pesquisaValida =
        textoPesquisa.trim() === "" ||
        transacao.titulo
          .toLowerCase()
          .includes(
            textoPesquisa.toLowerCase()
          );

      return (
        tipoValido &&
        periodoValido &&
        pesquisaValida
      );
    });

  return (
    <>
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <AnimatableText
            style={styles.title}
          >
            Controle Financeiro
          </AnimatableText>
        </View>

        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Renda Total
            </Text>

            <View
              style={
                styles.cardValueContainer
              }
            >
              <Icon
                name="money"
                size={20}
                color="#255573"
              />

              <Text
                style={[
                  styles.cardValue,

                  Number(rendaTotal) >= 0
                    ? styles.receitaText
                    : styles.despesaText,
                ]}
              >
                R$ {rendaTotal}
              </Text>
            </View>
          </View>

          <View style={styles.rowCards}>
            <View style={styles.smallCard}>
              <Text style={styles.cardTitle}>
                Receitas do Mês
              </Text>

              <Text
                style={[
                  styles.smallCardValue,
                  styles.receitaText,
                ]}
              >
                R$ {receitaMensal}
              </Text>
            </View>

            <View style={styles.smallCard}>
              <Text style={styles.cardTitle}>
                Despesas do Mês
              </Text>

              <Text
                style={[
                  styles.smallCardValue,
                  styles.despesaText,
                ]}
              >
                R$ {despesaMensal}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Saldo do Mês
            </Text>

            <Text
              style={[
                styles.cardValue,

                Number(saldo) >= 0
                  ? styles.receitaText
                  : styles.despesaText,
              ]}
            >
              R$ {saldo}
            </Text>
          </View>
        </View>

        <View
          style={styles.transactionsSection}
        >
          <View style={styles.sectionHeader}>
            <Text
              style={styles.sectionTitle}
            >
              Histórico de Transações
            </Text>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() =>
                setModalPesquisaVisible(
                  true
                )
              }
            >
              <Icon
                name="search"
                size={18}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>

          <View
            style={styles.filtersContainer}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
            >
              {[
                "Todos",
                "Receita",
                "Despesa",
              ].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.filterButton,

                    filtroTipo === tipo &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFiltroTipo(tipo)
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,

                      filtroTipo === tipo &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={{ marginTop: 8 }}
            >
              {[
                "Todos",
                "Hoje",
                "7 Dias",
                "30 Dias",
              ].map((periodo) => (
                <TouchableOpacity
                  key={periodo}
                  style={[
                    styles.filterButton,

                    filtroPeriodo ===
                      periodo &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setFiltroPeriodo(
                      periodo
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,

                      filtroPeriodo ===
                        periodo &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {periodo}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {transacoesFiltradas.length ===
          0 ? (
            <View
              style={styles.emptyContainer}
            >
              <Icon
                name="folder-open"
                size={40}
                color="#255573"
              />

              <Text style={styles.emptyText}>
                Nenhuma transação
                encontrada.
              </Text>
            </View>
          ) : (
            transacoesFiltradas.map(
              (transacao, index) => (
                <TouchableOpacity
                  key={
                    transacao.id_financa
                  }
                  style={[
                    styles.transactionCard,

                    index % 2 === 0
                      ? styles.evenRow
                      : styles.oddRow,
                  ]}
                  onPress={() =>
                    handleEditFinanca(
                      transacao.id_financa
                    )
                  }
                  activeOpacity={0.85}
                >
                  <View
                    style={
                      styles.transactionTop
                    }
                  >
                    <View
                      style={
                        styles.transactionHeaderLeft
                      }
                    >
                      <Icon
                        name={
                          transacao.tipo_transacao ===
                          "Receita"
                            ? "arrow-circle-up"
                            : "arrow-circle-down"
                        }
                        size={18}
                        color={
                          transacao.tipo_transacao ===
                          "Receita"
                            ? "#00C288"
                            : "#EC4E4E"
                        }
                      />

                      <Text
                        numberOfLines={1}
                        style={
                          styles.transactionTitle
                        }
                      >
                        {transacao.titulo}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.rightContainer
                      }
                    >
                      <Text
                        style={[
                          styles.transactionType,

                          transacao.tipo_transacao ===
                          "Receita"
                            ? styles.receitaText
                            : styles.despesaText,
                        ]}
                      >
                        {
                          transacao.tipo_transacao
                        }
                      </Text>

                      <TouchableOpacity
                        onPress={(event) => {
                          event.stopPropagation();

                          handleDeleteFinanca(
                            transacao.id_financa
                          );
                        }}
                      >
                        <Icon
                          name="trash"
                          size={22}
                          color="#EC4E4E"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View
                    style={
                      styles.transactionBottom
                    }
                  >
                    <Text
                      style={
                        styles.transactionInfo
                      }
                    >
                      Valor: R${" "}
                      {transacao.valor}
                    </Text>

                    <Text
                      style={
                        styles.transactionInfo
                      }
                    >
                      Frequência:{" "}
                      {
                        transacao.frequencia
                      }
                    </Text>

                    <Text
                      style={
                        styles.transactionInfo
                      }
                    >
                      Data de Início:{" "}
                      {new Date(
                        transacao.data
                      ).toLocaleDateString(
                        "pt-BR"
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            )
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalPesquisaVisible}
        onRequestClose={() =>
          setModalPesquisaVisible(false)
        }
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Pesquisar Transações
            </Text>

            <TextInput
              value={textoPesquisa}
              onChangeText={
                setTextoPesquisa
              }
              placeholder="Digite o título"
              placeholderTextColor="#777"
              style={styles.searchInput}
            />

            {transacoesFiltradas.length >
            0 ? (
              <ScrollView
                style={
                  styles.resultsContainer
                }
              >
                {transacoesFiltradas.map(
                  (transacao) => (
                    <TouchableOpacity
                      key={
                        transacao.id_financa
                      }
                      style={
                        styles.resultItem
                      }
                      onPress={() => {
                        setModalPesquisaVisible(
                          false
                        );

                        handleEditFinanca(
                          transacao.id_financa
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.resultText
                        }
                      >
                        {transacao.titulo}
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          handleDeleteFinanca(
                            transacao.id_financa
                          );

                          setModalPesquisaVisible(
                            false
                          );
                        }}
                      >
                        <Icon
                          name="trash"
                          size={22}
                          color="#EC4E4E"
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            ) : (
              <Text
                style={styles.noResultsText}
              >
                Nenhuma transação
                encontrada.
              </Text>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() =>
                setModalPesquisaVisible(
                  false
                )
              }
            >
              <Text
                style={styles.modalButtonText}
              >
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#E2EDF2",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flexGrow: 1,
    backgroundColor: "#E2EDF2",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },

  header: {
    alignItems: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 20,
    fontFamily: "SuezOne_400Regular",
    color: "#255573",
    textAlign: "center",
  },

  cardsContainer: {
    marginBottom: 8,
  },

  rowCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  card: {
    backgroundColor: "#C6DBE4",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#B5CDD8",
  },

  smallCard: {
    flex: 1,
    backgroundColor: "#C6DBE4",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#B5CDD8",
  },

  cardTitle: {
    fontSize: 15,
    color: "#255573",
    marginBottom: 8,
    fontFamily: "SuezOne_400Regular",
  },

  cardValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardValue: {
    fontSize: 18,
    color: "#000",
    fontWeight: "bold",
    marginLeft: 8,
  },

  smallCardValue: {
    fontSize: 17,
    fontWeight: "bold",
  },

  transactionsSection: {
    marginTop: 0,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 20,
    color: "#255573",
    fontFamily: "SuezOne_400Regular",
  },

  searchButton: {
    backgroundColor: "#255573",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  filtersContainer: {
    marginBottom: 12,
  },

  filterButton: {
    backgroundColor: "#C6DBE4",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#B5CDD8",
  },

  filterButtonActive: {
    backgroundColor: "#255573",
  },

  filterButtonText: {
    color: "#255573",
    fontWeight: "bold",
  },

  filterButtonTextActive: {
    color: "#FFF",
  },

  transactionCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#B5CDD8",
  },

  transactionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  transactionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "60%",
  },

  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  transactionBottom: {
    gap: 2,
  },

  transactionTitle: {
    fontSize: 16,
    color: "#255573",
    fontWeight: "bold",
  },

  transactionType: {
    fontSize: 15,
    fontWeight: "bold",
  },

  transactionInfo: {
    fontSize: 14,
    color: "#333",
  },

  receitaText: {
    color: "#00C288",
  },

  despesaText: {
    color: "#EC4E4E",
  },

  evenRow: {
    backgroundColor: "#D7E5EC",
  },

  oddRow: {
    backgroundColor: "#C6DBE4",
  },

  emptyContainer: {
    backgroundColor: "#C6DBE4",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 15,
    color: "#255573",
    textAlign: "center",
    marginTop: 10,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
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

  modalButton: {
    backgroundColor: "#255573",
    marginTop: 18,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
