<template>
    <el-container>
        <!-- Header -->
        <el-header>
            <el-button type="text" icon="el-icon-arrow-left" @click="goBackToList" class="back-button">
                <返回聊天室列表
            </el-button>
            <h2>聊天室: {{ chatRoomName }}</h2>
        </el-header>

        <!-- Main Content -->
        <el-main>
            <!-- Chat Messages -->
            <el-card class="chat-messages" shadow="hover" v ref="messagesContainer">
                <div v-for="message in messages" :key="message.id"
                    :class="['message', message.username == this.$store.getters.getCurrentUser ? 'message-right' : 'message-left']">
                    <div class="message-time"><strong>{{ message.username }}:</strong>{{ message.createdAt }}</div>
                    <div class="message-content">
                        
                        <p>{{ message.text }}</p>
                    </div>
                </div>
            </el-card>

            <!-- Message Input -->
            <el-form @submit.prevent="sendMessage" inline class="message-form">
                <el-input v-model="newMessage" placeholder="输入消息......" class="message-input" clearable />
                <el-button type="primary" @click="sendMessage">发送</el-button>
            </el-form>
        </el-main>
    </el-container>
</template>

<script>
import axios from "axios";
import { Client } from "@stomp/stompjs";


export default {
    data() {
        return {
            chatRoomName: "",
            messages: [],
            newMessage: "",
            stompClient: null, // 保存 STOMP 客户端实例
            currentUser: null
        };
    },
    async mounted() {
        const roomId = this.$route.params.roomId;

        this.currentUser = this.$store.getters.getCurrentUser;
        console.log("111"+this.$store.getters.getCurrentUser);

        // 获取聊天室数据
        await this.fetchChatRoomData(roomId);
        this.stompClient = new Client({
            brokerURL: "ws://localhost:8765/ws", // 你的 WebSocket URL
            debug: (str) => console.log(str), // 调试日志
            reconnectDelay: 5000, // 自动重连时间
        });

        // 激活客户端
        this.stompClient.onConnect = () => {
            console.log("Connected to WebSocket");

            // 订阅特定聊天室
            this.stompClient.subscribe(`/topic/chatroom/${roomId}`, (message) => {
                this.fetchChatRoomData(roomId); // 刷新数据
                this.scrollToBottom(); // 数据加载后滚动到底部
            });
        };

        // 激活 STOMP 客户端
        this.stompClient.activate();
    },
    methods: {
        // Fetch chat room data
        async fetchChatRoomData(roomId) {
            try {
                const chatRes = await axios.get(`/api/chatroom/${roomId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });

                if (chatRes.data) {
                    this.chatRoomName = chatRes.data.name;
                }

                const roomRes = await axios.get(`/api/chatroomMsg/${roomId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });


                // response.data如果不为空
                this.messages = [];

                if (roomRes.data) {
                    //循环遍历
                    for (let i = 0; i < roomRes.data.length; i++) {
                        this.messages.push({
                            id: roomRes.data[i].messageId,
                            username: roomRes.data[i].user.username,
                            text: roomRes.data[i].messageText,
                            createdAt: roomRes.data[i].createdAt
                        });
                    }
                }

                this.scrollToBottom(); // 数据加载后滚动到底部

            } catch (error) {
                console.error("Failed to load chat room data:", error);
            }
        },
        // Send message
        async sendMessage() {
            //判断消息不能为空
            if (!this.newMessage) {
                this.$message.error("消息不能为空");
                return;
            }
            const roomId = this.$route.params.roomId;
            try {
                await axios.post(
                    `/api/chatroom/${roomId}/messages`,
                    { messageText: this.newMessage },
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                );

                this.newMessage = "";
                await this.fetchChatRoomData(roomId); // 刷新数据


            } catch (error) {
                console.error("Failed to send message:", error);
            }
        },
        // Go back to the chat room list
        goBackToList() {
            this.$router.push("/chatroomList");
        },
        scrollToBottom() {
            const container = this.$refs.messagesContainer?.$el || this.$refs.messagesContainer;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        },
    },
};
</script>

<style scoped>
.chat-messages {
    height: 60vh; /* 占据视窗高度的 90% */
    overflow-y: scroll;
    padding: 20px;
    margin-top: 20px;
}


.message-form {
    margin-top: 20px;
    display: flex;
    align-items: center;
}

.message-input {
    flex: 1;
    margin-right: 10px;
}

.back-button {
    margin-right: 20px;
}



.message {
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    /* 垂直排列 */
}

.message-time {
    font-size: 12px;
    color: #999;
    /* 时间的颜色变淡一些 */
    margin-bottom: 5px;
    /* 时间与内容之间的间距 */
}

.message-content {
    font-size: 14px;
    color: #333;
    /* 内容的颜色更显眼 */
    padding: 8px 12px;
    border-radius: 10px;
    max-width: 60%;

}





/* 左侧消息 */
.message-left {
    align-items: flex-start;
    /* 对齐到左边 */
}

.message-left .message-content {
    background-color: #f0f0f0;
    /* 左侧消息背景色 */
}

/* 右侧消息 */
.message-right {
    align-items: flex-end;
    /* 对齐到右边 */
}

.message-right .message-content {
    background-color: #cce5ff;
    /* 右侧消息背景色 */
    color: #0056b3;
}
</style>