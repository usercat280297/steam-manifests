using BepInEx;
using HarmonyLib;
using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

namespace DevourVietnamesePatch
{
    [BepInPlugin("com.devour.vi.patch", "DEVOUR Vietnamese Patch", "1.0.0")]
    public class DevourVietnamesePatch : BaseUnityPlugin
    {
        private static Dictionary<string, string> translations;
        private static Harmony harmony;

        void Awake()
        {
            Logger.LogInfo("🇻🇳 DEVOUR Vietnamese Patch initialized!");
            InitializeTranslations();
            harmony = new Harmony("com.devour.vi.patch");
            harmony.PatchAll();
            Logger.LogInfo("✅ Vietnamese patches applied!");
        }

        private static void InitializeTranslations()
        {
            translations = new Dictionary<string, string>
            {
                // ===== CHARACTERS =====
                { "Moonless Night", "Đêm Không Trăng" },
                { "The Mother", "Mẹ" },
                { "The Caregiver", "Người Chăm Sóc" },
                { "The Mourning Mother", "Mẹ Tuyệt Vọng" },
                
                // ===== PERKS (70+ terms) =====
                { "Acceleration", "Tăng Tốc" },
                { "Airborne", "Bay Lên" },
                { "Amplified", "Khuếch Đại" },
                { "Armourer", "Thợ Duy Trì" },
                { "Blind Spot", "Điểm Mù" },
                { "Blocker", "Chắn Đường" },
                { "Bluff", "Che Đậu" },
                { "Bullet Proof", "Chống Đạn" },
                { "Cache", "Kho Chứa" },
                { "Cagey", "Xấp Xỉ" },
                { "Carapace", "Vỏ Bảo Vệ" },
                { "Chaos", "Hỗn Loạn" },
                { "Claws Out", "Móng Vuốt Ra" },
                { "Cleansing", "Thanh Tẩy" },
                { "Cold Blooded", "Máu Lạnh" },
                { "Comet", "Sao Chổi" },
                { "Common Sense", "Lẽ Thường Tình" },
                { "Escape Artist", "Nghệ Sĩ Trốn Thoát" },
                { "Evasion", "Tránh Né" },
                { "Ethereal", "Vô Hình" },
                { "Evolver", "Người Tiến Hóa" },
                { "Expedite", "Thúc Giục" },
                { "Expert", "Chuyên Gia" },
                { "Farsighted", "Viễn Thị" },
                { "Feral", "Dã Man" },
                { "Firepower", "Sức Bắn" },
                { "Fleet", "Nhanh Nhẹn" },
                { "Focus", "Tập Trung" },
                { "Fog", "Sương Mù" },
                { "Fold", "Gập Lại" },
                { "Forager", "Người Lương Thực" },
                { "Foresight", "Nhìn Trước" },
                { "Fortified", "Được Tăng Cường" },
                { "Fortune", "May Mắn" },
                { "Fragile", "Yếu Đuối" },
                { "Freelance", "Tự Do" },
                { "Frozen", "Đông Cứng" },
                { "Ghost", "Ma" },
                { "Give and Take", "Cho Và Nhận" },
                { "Grim", "Ảm Đạm" },
                { "Grounded", "Neo Chân" },
                { "Guardian", "Bảo Vệ" },
                { "Hard Light", "Ánh Sáng Cứng" },
                { "Havoc", "Hỗn Mang" },
                { "Heals", "Chữa Lành" },
                { "Heavyweight", "Nặng" },
                { "Hidden Potential", "Tiềm Năng Ẩn" },
                { "Hypnotic", "Thôi Miên" },
                { "Imbalance", "Mất Cân Bằng" },
                { "Imprint", "Dấu Ấn" },
                { "Impulse", "Xung Động" },
                { "Incisive", "Rắn Rỏi" },
                { "Indomitable", "Bất Khuất" },
                { "Instability", "Không Ổn Định" },
                { "Instinct", "Bản Năng" },
                { "Intercept", "Chặn Lại" },
                { "Intrepid", "Anh Dũng" },
                { "Intuition", "Trực Giác" },
                { "Ironclad", "Áo Giáp" },
                { "Irradiance", "Bức Xạ" },
                { "Jackpot", "Giải Lớn" },
                { "Jinx", "Tỷ Tỷ" },
                
                // ===== ITEMS =====
                { "Light", "Ánh Sáng" },
                { "Rope", "Sợi Dây" },
                { "Key", "Chìa Khóa" },
                { "Matches", "Que Diêm" },
                { "Whistle", "Còi Dắt" },
                { "Crucifix", "Thánh Giá" },
                { "Music Box", "Hộp Âm Nhạc" },
                { "Bottle", "Chai" },
                { "Lantern", "Đèn Lồng" },
                { "Flashlight", "Đèn Pin" },
                
                // ===== UI MENU =====
                { "Wait Room", "Sảnh Chờ" },
                { "Lobby", "Sảnh Chơi" },
                { "Main Menu", "Menu Chính" },
                { "Loading", "Đang Tải" },
                { "Settings", "Cài Đặt" },
                { "Audio", "Âm Thanh" },
                { "Video", "Video" },
                { "Gameplay", "Cách Chơi" },
                { "Graphics", "Đồ Họa" },
                { "Controls", "Điều Khiển" },
                { "Keyboard", "Bàn Phím" },
                { "Mouse", "Chuột" },
                { "Gamepad", "Tay Cầm" },
                { "Help", "Trợ Giúp" },
                { "Credits", "Tín Dụng" },
                { "Exit", "Thoát" },
                { "Quit", "Thoát Game" },
                
                // ===== GAME ACTIONS =====
                { "Start Game", "Bắt Đầu" },
                { "Continue", "Tiếp Tục" },
                { "New Game", "Trò Chơi Mới" },
                { "Load Game", "Tải Trò Chơi" },
                { "Save Game", "Lưu Trò Chơi" },
                { "Pause", "Tạm Dừng" },
                { "Resume", "Tiếp Tục Chơi" },
                { "Restart", "Bắt Đầu Lại" },
                { "Back", "Quay Lại" },
                { "Next", "Tiếp Theo" },
                { "Previous", "Trước Đó" },
                { "Select", "Chọn" },
                { "Confirm", "Xác Nhận" },
                { "Cancel", "Hủy" },
                
                // ===== GAME STATES =====
                { "Survive", "Sống Sót" },
                { "Escape", "Trốn Thoát" },
                { "Hunt", "Săn Đuổi" },
                { "Protect", "Bảo Vệ" },
                { "Dead", "Chết" },
                { "Alive", "Sống" },
                { "Victory", "Chiến Thắng" },
                { "Defeat", "Thất Bại" },
                { "Game Over", "Game Over" },
            };
        }

        public static string Translate(string text)
        {
            if (string.IsNullOrEmpty(text))
                return text;

            if (translations != null && translations.TryGetValue(text, out var translated))
                return translated;

            return text;
        }

        // Patch Text component setter
        [HarmonyPrefix]
        [HarmonyPatch(typeof(Text), "set_text")]
        public static void PatchTextSetter(Text __instance, string value)
        {
            if (value != null)
            {
                var translated = Translate(value);
                if (translated != value)
                {
                    __instance.text = translated;
                }
            }
        }

        // Patch TextMeshProUGUI component setter
        [HarmonyPrefix]
        [HarmonyPatch(typeof(TMPro.TextMeshProUGUI), "set_text")]
        public static void PatchTextMeshProSetter(TMPro.TextMeshProUGUI __instance, string value)
        {
            if (value != null)
            {
                var translated = Translate(value);
                if (translated != value)
                {
                    __instance.text = translated;
                }
            }
        }
    }
}

