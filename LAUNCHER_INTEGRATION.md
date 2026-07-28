# 🚀 Minecraft Launcher Connection & Skin Sync Guide (Hindi & English)

This guide explains how to connect your custom Minecraft Launcher (e.g., Android Launcher, Modrinth-style Launcher, or PC custom launcher) to this backend skin server so that players can log in using their website credentials and their custom skins, capes, and cosmetics display automatically **in-game**!

---

## 🌎 1. How this Mechanism Works (ये कैसे काम करता है)

Minecraft uses the **Yggdrasil Protocol** (the official Microsoft/Mojang system) to authenticate accounts and load player textures (skins and capes).

To bypass Mojang and load skins from **YOUR website**, we use `authlib-injector`. It is a lightweight Java agent that intercepts Minecraft's network calls and redirects them to your custom server URL. This is the exact same mechanism used by Ely.by, BedrockConnect, and major custom launchers.

---

## 🛠️ Step-by-Step Launcher Integration (लॉन्चर से जोड़ने का तरीका)

### Step 1: Download `authlib-injector.jar`
You need to bundle the `authlib-injector.jar` file inside your launcher or have the launcher download it automatically.
* Official Download: [authlib-injector on GitHub Releases](https://github.com/yushijinhun/authlib-injector/releases)

---

### Step 2: Inject Java JVM Arguments on Game Launch
When your launcher boots up the Minecraft JVM (Java Virtual Machine), it must pass the `-javaagent` argument pointing to your custom backend domain.

#### 💻 PC Launch Argument (Command Line):
```bash
-javaagent:path/to/authlib-injector.jar=http://YOUR_SERVER_URL
```
Replace `http://YOUR_SERVER_URL` with your actual domain (e.g., `https://craftynmc-server.onrender.com`).

#### 📱 Android PojavLauncher/Custom Launcher Integration:
If you are developing or modifying an Android launcher, you must edit `GameRunner.java` or your launch command builder to include the javaagent argument dynamically before launching the game:
```java
List<String> jvmArgs = new ArrayList<>();
jvmArgs.add("-javaagent:" + authlibInjectorPath + "=" + "https://YOUR_SERVER_URL");
```

---

### Step 3: Connect User Login in Launcher UI (लॉगिन स्क्रीन को जोड़ना)
Instead of asking for Microsoft login, your launcher login UI should send a standard POST request to your auth server to authenticate and retrieve a session token.

#### HTTP Request to authenticate (Yggdrasil Authenticate Endpoint):
When the player enters their username and password in your launcher:
* **Endpoint:** `POST https://YOUR_SERVER_URL/authenticate` (This protocol endpoint is fully supported by our backend in `yggdrasil.js`)
* **Payload Format (JSON):**
```json
{
  "username": "Twicefear",
  "password": "your_password"
}
```
* **Response (JSON):**
Our server responds with the `accessToken` and player's custom `uuid` and `username`. You must save this `accessToken` and pass it to Minecraft's launch parameters:
```bash
--username <player_name> --uuid <player_uuid> --accessToken <session_token> --userType legacy
```

---

## 👕 2. Skin and Cape Rendering In-Game (गेम में स्किन और केप कैसे दिखेगी)

When `authlib-injector` is active, Minecraft queries your server dynamically when joining multiplayer or singleplayer worlds.
1. When you join a world, Minecraft calls `/sessionserver/session/minecraft/profile/<UUID>`.
2. Our backend (`src/routes/yggdrasil.js`) automatically signs the skin and cape PNGs using the RSA keypair we generated.
3. Minecraft reads the signed payload, loads the skin/cape from your server's database (`skinPngBase64` and `capePngBase64`), and renders it perfectly on your character inside the game!

---

---

## 🇮🇳 हिंदी गाइड: लॉन्चर को वेबसाइट से कैसे जोड़ें

यह गाइड बताती है कि आप अपने कस्टम लॉन्चर (जैसे PojavLauncher Android या PC Launcher) को अपनी इस नई वेबसाइट से कैसे कनेक्ट करेंगे ताकि वेबसाइट पर अपलोड की हुई Skin और Cape गेम के अंदर बिल्कुल असली माइनक्राफ्ट की तरह दिखाई दे।

### 1. यह कैसे काम करता है?
माइनक्राफ्ट गेम स्किन और आईडी चेक करने के लिए मोजांग (Mojang) के सर्वर को रिक्वेस्ट भेजता है। हम **`authlib-injector`** नाम के एक छोटे से एजेंट टूल का उपयोग करते हैं। यह टूल माइनक्राफ्ट के रास्ते को बदलकर उसे मोजांग के बजाय **आपकी वेबसाइट** की तरफ मोड़ देता है। यह वही सिस्टम है जो Ely.by इस्तेमाल करता है।

---

### 2. लॉन्चर में क्या सेटिंग्स करनी होगी?

#### **स्टेप A: `authlib-injector.jar` डाउनलोड करें**
आपको अपने लॉन्चर में `authlib-injector.jar` फाइल को शामिल करना होगा। इसे आप [यहाँ से](https://github.com/yushijinhun/authlib-injector/releases) डाउनलोड कर सकते हैं।

#### **स्टेप B: गेम स्टार्ट करते समय JVM Arguments जोड़ें**
जब आपका लॉन्चर माइनक्राफ्ट गेम को स्टार्ट (Launch) करे, तो आपको जावा कमांड में यह आर्गुमेंट जोड़ना होगा:
```bash
-javaagent:authlib-injector.jar=https://YOUR_WEBSITE_URL
```
*(उदाहरण के लिए: `-javaagent:authlib-injector.jar=https://craftynmc.onrender.com`)*

**Android PojavLauncher कोड में बदलाव:**
अगर आप PojavLauncher के सोर्स कोड को बदल रहे हैं, तो `GameRunner.java` या जहां गेम की कमांड्स बनती हैं, वहां इस आर्गुमेंट को जोड़ें:
```java
commandList.add("-javaagent:" + authlibPath + "=" + "https://your-website.com");
```

---

#### **स्टेप C: लॉन्चर लॉगिन (Login) एपीआई कनेक्शन**
लॉन्चर की लॉगिन स्क्रीन पर जब यूजर अपना यूजरनेम और पासवर्ड डालेगा, तब लॉन्चर को बैकएंड सर्वर पर रिक्वेस्ट भेजनी होगी:
* **URL:** `POST https://YOUR_WEBSITE_URL/authenticate`
* **JSON बॉडी:**
```json
{
  "username": "Twicefear",
  "password": "your_password"
}
```
* **रिस्पॉन्स:** वहां से आपको `accessToken` और `selectedProfile` (जिसमे UUID और Username होता है) मिलेगा।

गेम को स्टार्ट करते समय आपको यह पैरामीटर्स माइनक्राफ्ट को पास करने होंगे:
```bash
--username <USER_NAME> --uuid <UUID> --accessToken <ACCESS_TOKEN> --userType legacy
```

---

### 3. स्किन और केप (Skin & Cape) गेम में कैसे दिखेंगे?
1. जब गेम लोड होगा, माइनक्राफ्ट आपकी वेबसाइट के `/sessionserver/session/minecraft/profile/<UUID>` रूट से स्किन/केप का पता लगाएगा।
2. हमारा बैकएंड सर्वर डेटाबेस से स्किन का बेस64 (Base64) डेटा निकालकर माइनक्राफ्ट को भेज देगा।
3. गेम में प्लेयर की स्किन और केप पूरी तरह से रेंडर हो जाएगी!

**⚠️ कॉस्मेटिक्स (जैसे पंख, टोपी) के लिए ध्यान दें:**
माइनक्राफ्ट का डिफॉल्ट गेम सिर्फ स्किन और केप को रेंडर कर सकता है। अगर आप चाहते हैं कि वेबसाइट पर खरीदी हुई टोपी या पंख (Hats/Wings) भी गेम में दिखें, तो आपको क्लाइंट में एक छोटा सा **Fabric/Forge Mod** डालना होगा जो आपकी वेबसाइट से कॉस्मेटिक्स का JSON पढ़कर उसे प्लेयर के सिर या पीठ पर रेंडर कर दे। यह सर्वर से पूरी तरह कम्पेटिबल है!
