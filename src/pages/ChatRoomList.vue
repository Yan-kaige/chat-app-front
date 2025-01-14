<template>
    <el-container>
        <el-header>
            <h1 class="header-title">聊天室列表</h1>

        </el-header>
        <el-main>
            <div>
                <el-button type="danger" @click="logout" class="logout-btn">登出</el-button>
                <el-button type="success" @click="openCreateRoomModal" class="create-room-btn">
                    创建新聊天室
                </el-button>
                <el-button @click="viewMsg">我的消息查看</el-button>

            </div>
            <el-table :data="chatRooms" style="width: 100%">
                <el-table-column prop="name" label="聊天室名称"></el-table-column>
                <el-table-column prop="createdBy" label="创建人"></el-table-column>
                <el-table-column label="操作">
                    <template #default="scope">
                        <el-button type="primary" @click="enterChatRoom(scope.row.id)">进入</el-button>
                        <el-button type="danger" @click="deleteChatRoom(scope.row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>


            <!-- 模态框 -->
            <el-dialog v-model="showCreateRoomModal" title="创建新聊天室" width="500px">
                <el-input v-model="newRoomName" placeholder="输入聊天室名称" clearable />
                <template #footer>
                    <el-button @click="showCreateRoomModal = false">取消</el-button>
                    <el-button type="primary" @click="createChatRoom">确认</el-button>
                </template>
            </el-dialog>


            <el-dialog v-model="showMsgModel" title="我的消息" width="700px">
                <el-table :data="invitations" style="width: 100%">
                    <el-table-column prop="senderId" label="发送人"></el-table-column>
                    <el-table-column prop="messageText" label="消息"></el-table-column>
                    <el-table-column prop="expiredAt" label="过期时间"></el-table-column>
                    <el-table-column>
                        <template #default="scope">
                            <el-button size="small" @click="acceptInvitation(scope.row)">接受</el-button>
                            <el-button size="small" @click="deleteInvitation(scope.row.id)" type="danger">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>

            </el-dialog>

        </el-main>
    </el-container>
</template>

<script>
import axios from 'axios';
import { Client } from "@stomp/stompjs";
import { da } from 'element-plus/es/locales.mjs';

export default {
    data() {
        return {
            chatRooms: [],
            showCreateRoomModal: false,
            newRoomName: '',
            visible: false,
            showMsgModel: false, // 消息模态框
            invitations: [],
        };
    },
    async mounted() {
        await this.fetchChatRooms();


        this.stompClient = new Client({
            brokerURL: "ws://localhost:8765/ws", // 你的 WebSocket URL
            debug: (str) => console.log(str), // 调试日志
            reconnectDelay: 5000, // 自动重连时间
        });

        // 激活客户端
        this.stompClient.onConnect = () => {
            console.log("Connected to WebSocket");

            // 订阅特定聊天室
            this.stompClient.subscribe(`/topic/invite/${localStorage.getItem("chat_cur_user_id")}`, (message) => {
                this.$notify({
                    title: "新邀请",
                    message: message.body,
                    type: "info",
                    duration: 3000,
                });
            });
        };

        // 激活 STOMP 客户端
        this.stompClient.activate();
    },
    methods: {
        logout() {
            localStorage.removeItem("token"); // Remove token
            localStorage.removeItem("chat_cur_user");
            this.$router.push("/login"); // Redirect to login page
        },
        viewMsg() {
            this.fetchInvitations();
            this.showMsgModel = true;

        },
        async fetchChatRooms() {
            try {
                const response = await axios.get('/api/chatroom', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                this.chatRooms = response.data;
            } catch (error) {
                console.error('Failed to load chat rooms:', error);
            }
        },
        openCreateRoomModal() {
            console.log('Create chat room response:', this.showCreateRoomModal); // 调试日志

            this.showCreateRoomModal = true;
        },
        closeCreateRoomModal() {
            this.showCreateRoomModal = false;
            this.newRoomName = '';
        },
        async createChatRoom() {
            if (!this.newRoomName) {
                this.$message.error('Please enter a chat room name!');
                return;
            }
            try {
                await axios.post(
                    '/api/chatroom/create',
                    { name: this.newRoomName },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );
                this.$message.success('Chat room created successfully!');
                this.closeCreateRoomModal();
                this.fetchChatRooms();
            } catch (error) {
                this.$message.error('Failed to create chat room.');
                console.error(error);
            }
        },
        async deleteChatRoom(roomId) {
            try {
                await axios.delete(`/api/chatroom/${roomId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                alert('Chat room deleted successfully!');
                await this.fetchChatRooms(); // 更新聊天室列表
            } catch (error) {
                alert('Failed to delete chat room. Please try again.');
                console.error(error);
            }
        },
        enterChatRoom(roomId) {
            this.$router.push(`/chatroom/${roomId}`);
        },
        async fetchInvitations() {
            const res = await axios.get("/api/user/invitations", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            this.invitations = res.data;
        },
        async acceptInvitation(data) {
            try {
                await axios.post(`/api/invitations/${data.id}/accept`);
                this.$message.success("邀请已接受");
                this.fetchInvitations();

                //进入到指定的聊天室
                this.$router.push(`/chatroom/${data.chatRoomId}`);
            } catch (error) {
                console.error("接受邀请失败", error);
            }
        },
        async deleteInvitation(messageId) {
            try {
                await axios.delete(`/api/invitations/${messageId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                this.$message.success("邀请已删除");
                this.fetchInvitations();
            } catch (error) {
                console.error("删除邀请失败", error);
            }
        },
    },
};
</script>

<style scoped>
.header-title {
    text-align: center;
    margin: 0;
    /* 去掉默认 margin */
    font-size: 50px;
    /* 可根据需要调整字体大小 */
}
</style>