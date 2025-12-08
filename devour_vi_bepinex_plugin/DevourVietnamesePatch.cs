using HarmonyLib;
using System;
using System.Collections.Generic;

namespace DevourVietnamesePatch
{
    public class DevourVietnamesePatch
    {
        private static Harmony harmony;
        
        // Static translations accessible to patch methods
        private static Dictionary<string, string> translations = new Dictionary<string, string>
        {
            { "Single Player", "Chơi Một Người" },
            { "Host Game", "Tạo Phòng" },
            { "Join Game", "Vào Phòng" },
            { "Options", "Tùy Chọn" },
            { "Quit", "Thoát" },
            { "Resume", "Tiếp Tục" },
            { "Pause", "Tạm Dừng" },
            { "Start", "Bắt Đầu" },
            { "Settings", "Cài Đặt" },
            { "Language", "Ngôn Ngữ" },
            { "English", "Tiếng Anh" },
            { "Vietnamese", "Tiếng Việt" },
            { "Audio", "Âm Thanh" },
            { "Graphics", "Đồ Họa" },
            { "Controls", "Điều Khiển" },
            { "Back", "Quay Lại" },
            { "Apply", "Áp Dụng" },
            { "New Game", "Trò Chơi Mới" },
            { "Difficulty", "Độ Khó" },
            { "Easy", "Dễ" },
            { "Normal", "Bình Thường" },
            { "Hard", "Khó" },
            { "Map", "Bản Đồ" },
            { "Wave", "Sóng" },
            { "Score", "Điểm" }
        };

        void Awake()
        {
            try
            {
                harmony = new Harmony("com.devour.vi.patch");
                harmony.PatchAll(typeof(StringPatcher));
                Console.WriteLine("✅ Vietnamese patches loaded!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error: {ex}");
            }
        }

        [HarmonyPatch(typeof(String), nameof(String.Intern))]
        public static class StringPatcher
        {
            public static void Postfix(ref String __result)
            {
                if (!string.IsNullOrEmpty(__result) && translations.TryGetValue(__result, out var vn))
                {
                    __result = vn;
                }
            }
        }
    }
}

