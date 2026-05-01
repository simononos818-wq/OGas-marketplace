import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { getChatRoom, sendMessage, markAsRead } = useChat();
  const [message, setMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadChatRoom(); }, [id]);

  const loadChatRoom = async () => {
    try {
      const room = await getChatRoom(id as string, user?.uid || '');
      setChatRoom(room);
      if (room) markAsRead(id as string);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    try {
      await sendMessage(id as string, user.uid, message.trim());
      setMessage('');
      loadChatRoom();
    } catch (e) { console.error(e); }
  };

  if (loading) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: chatRoom?.name || 'Chat' }} />
      <FlatList
        data={chatRoom?.messages || []}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.senderId === user?.uid ? styles.me : styles.them]}>
            <Text style={[styles.text, item.senderId === user?.uid ? styles.meText : styles.themText]}>{item.text}</Text>
            <Text style={styles.time}>{item.timestamp?.toDate?.().toLocaleTimeString?.() || ''}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={message} onChangeText={setMessage} placeholder="Type..." multiline />
        <TouchableOpacity style={[styles.send, !message.trim() && styles.sendDisabled]} onPress={handleSend} disabled={!message.trim()}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  messagesList: { padding: 16 },
  bubble: { padding: 12, marginVertical: 4, borderRadius: 16, maxWidth: '80%' },
  me: { backgroundColor: '#FF6B00', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  them: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  text: { fontSize: 16 },
  meText: { color: '#fff' },
  themText: { color: '#333' },
  time: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4, alignSelf: 'flex-end' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', marginTop: 16 },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, marginRight: 10 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF6B00', justifyContent: 'center', alignItems: 'center' },
  sendDisabled: { backgroundColor: '#ccc' },
});
