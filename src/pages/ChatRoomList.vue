<template>
    <el-container>
        <el-header>
            <h1 class="header-title">CHAT ROOM</h1>

        </el-header>
        <el-main>
            <div>
                <el-button type="danger" @click="logout" class="logout-btn">登出</el-button>
                <el-button type="success" @click="openCreateRoomModal" class="create-room-btn">
                    创建新聊天室
                </el-button>
                <el-button @click="fetchMyChatRooms">我的聊天室</el-button>

                <el-button @click="viewMsg">我的消息查看</el-button>

            </div>
            <el-table :data="chatRooms" style="width: 100%">
                <el-table-column prop="name" label="聊天室名称"></el-table-column>
                <el-table-column prop="createdBy" label="创建人"></el-table-column>
                <el-table-column label="操作">
                    <template #default="scope">
                        <el-button type="primary" @click="enterChatRoom(scope.row.id)">进入</el-button>
 
                    </template>
                </el-table-column>
            </el-table>


            <!-- 模态框 -->
            <el-dialog v-model="showCreateRoomModal" title="创建新聊天室" width="500px">
                <el-form :model="newRoom">
                    <el-form-item label="聊天室名称">
                        <el-input v-model="newRoom.name"></el-input>
                    </el-form-item>
                    <el-form-item label="聊天室密码（可选）">
                        <el-input type="password" v-model="newRoom.password"></el-input>
                    </el-form-item>
                </el-form>

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


            <el-dialog title="我的聊天室" v-model="myRoomsVisible" width="50%">
                <el-table :data="myRooms" style="width: 100%">
                    <el-table-column prop="name" label="聊天室名称"></el-table-column>
                    <el-table-column prop="createdAt" label="创建时间"></el-table-column>
                    <el-table-column label="操作">
                        <template #default="scope">
                            <el-button type="warning" @click="showUpdatePasswordDialog(scope.row)">修改密码</el-button>
                            <el-button type="danger" @click="deleteChatRoom(scope.row.id)">删除聊天室</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-dialog>

            <el-dialog title="修改聊天室密码" v-model="updatePasswordVisible" width="30%">
                <el-input v-model="newPassword" placeholder="输入新密码"></el-input>
                <template #footer>
                    <el-button @click="updatePasswordVisible = false">取消</el-button>
                    <el-button type="primary" @click="updateRoomPassword">确定</el-button>
                </template>
            </el-dialog>

        </el-main>
    </el-container>
</template>

<script>
import axios from "../axios";
import { ca, da } from 'element-plus/es/locales.mjs';

export default {
    data() {
        return {
            chatRooms: [],
            showCreateRoomModal: false,
            newRoom: {
                name: '',
                password: '',
            },
            visible: false,
            showMsgModel: false, // 消息模态框
            invitations: [],
            myRoomsVisible: false,  // 我的聊天室模态框
            updatePasswordVisible: false, // 修改密码模态框
            myRooms: [], // 我的聊天室列表
            selectedRoom: null, // 选中的聊天室
            newPassword: "", // 新密码
        };
    },
    async mounted() {
        await this.fetchChatRooms();



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
            this.newRoom = {
                name: '',
                password: '',
            };
        },
        async createChatRoom() {
            if (!this.newRoom.name) {
                this.$message.error('Please enter a chat room name!');
                return;
            }
            try {
                await axios.post(
                    '/api/chatroom/create',
                    this.newRoom,

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
            // Confirm dialog
            this.$confirm('确认删除吗?', 'Warning', {
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                type: 'warning',
            }).then(async() => {
                try {
                    await axios.delete(`/api/chatroom/${roomId}`);
                    await this.fetchChatRooms(); // 更新聊天室列表
                    await this.fetchMyChatRooms();
                    this.$message.success('Chat room deleted successfully!');
                }
                catch (error) {
                    this.$message.error('Failed to delete chat room.');
                    console.error(error);
                }
            })

            

        },
        async enterChatRoom(roomId) {

            const room = this.chatRooms.find(r => r.id === roomId);

            //自己创建的聊天室直接进入
            if (room.createdBy == localStorage.getItem("chat_cur_user_id")) {
                this.$router.push(`/chatroom/${roomId}`);
                return;
            }

            if (room.password) {
                const password = await this.$prompt('请输入聊天室密码', '密码验证', {
                    inputType: 'password',
                }).catch(() => null);

                if (!password) return;

                const response = await axios.post(`/api/chatroom/${roomId}/join`, null, {
                    params: { password: password.value },
                });

                if (response.data != 'Password is incorrect') {
                    this.$router.push(`/chatroom/${roomId}`);
                } else {
                    this.$message.error('密码错误');
                }
            } else {
                await axios.post(`/api/chatroom/${roomId}/join`);
                this.$router.push(`/chatroom/${roomId}`);
            }
        },
        async fetchInvitations() {
            const res = await axios.get("/api/user/invitations");
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
                await axios.delete(`/api/invitations/${messageId}`);
                this.$message.success("邀请已删除");
                this.fetchInvitations();
            } catch (error) {
                console.error("删除邀请失败", error);
            }
        },
        async fetchMyChatRooms() {
            try {
                const response = await axios.get(`/api/chatroom/my`, );
                this.myRooms = response.data;
                this.myRoomsVisible = true;
            } catch (error) {
                console.error("Failed to fetch my chat rooms:", error);
            }
        },
        showUpdatePasswordDialog(room) {
            this.selectedRoom = room;
            this.newPassword = "";
            this.updatePasswordVisible = true;
        },
        async updateRoomPassword() {
            try {
                await axios.post(`/api/chatroom/${this.selectedRoom.id}/update-password`, null, {
                    params: {
                        newPassword: this.newPassword,
                    },
                });
                this.updatePasswordVisible = false;
                this.$message.success("密码更新成功！");
            } catch (error) {
                console.error("Failed to update room password:", error);
                this.$message.error("更新密码失败！");
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