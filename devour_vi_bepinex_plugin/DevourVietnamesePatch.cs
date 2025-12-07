using BepInEx;
using HarmonyLib;
using System.Collections.Generic;

namespace DevourVietnamesePatch
{
    [BepInPlugin("com.devour.vi.patch", "DEVOUR Vietnamese Patch", "1.0.0")]
    public class DevourVietnamesePatch : BaseUnityPlugin
    {
        // Vietnamese translations
        private static Dictionary<string, string> Translations = new Dictionary<string, string>
        {
            // Outfits
            { "Moonless Night", "Đêm Không Trăng" },
            { "Claws Out", "Móng Vuốt Ra" },
            
            // Perks
            { "Acceleration", "Tăng Tốc" },
            { "Bloodlust", "Khát Máu" },
            { "Speed Boost", "Tăng Tốc Độ" },
            { "Stamina", "Sức Chịu Đựng" },
            { "Strength", "Sức Mạnh" },
            
            // UI
            { "Start Game", "Bắt Đầu Game" },
            { "Continue", "Tiếp Tục" },
            { "Settings", "Cài Đặt" },
            { "Exit", "Thoát" },
            { "Main Menu", "Menu Chính" },
            { "Pause", "Tạm Dừng" },
            { "Resume", "Tiếp Tục" },
        };

        void Awake()
        {
            Logger.LogInfo("DEVOUR Vietnamese Patch loaded!");
            Harmony.CreateAndPatchAll(typeof(DevourVietnamesePatch));
        }

        // Patch any method that displays text
        [HarmonyPostfix]
        [HarmonyPatch(typeof(UnityEngine.UI.Text), nameof(UnityEngine.UI.Text.text), MethodType.Setter)]
        public static void PatchTextDisplay(UnityEngine.UI.Text __instance, string value)
        {
            if (value != null && Translations.ContainsKey(value))
            {
                __instance.text = Translations[value];
            }
        }

        // Also patch TextMeshProUGUI if available
        [HarmonyPostfix]
        [HarmonyPatch(typeof(TMPro.TextMeshProUGUI), nameof(TMPro.TextMeshProUGUI.text), MethodType.Setter)]
        public static void PatchTextMeshDisplay(TMPro.TextMeshProUGUI __instance, string value)
        {
            if (value != null && Translations.ContainsKey(value))
            {
                __instance.text = Translations[value];
            }
        }
    }
}
