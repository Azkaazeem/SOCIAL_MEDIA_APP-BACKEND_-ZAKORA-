const router = require("express").Router();
const axios = require("axios");

// Comprehensive Knowledge Base & Conversational AI Engine for ZakoraSocial
function generateLocalAiResponse(message, userContext = {}) {
  const raw = (message || "").trim();
  const text = raw.toLowerCase();

  // 1. GREETINGS & HEALTH CHECK (English, Urdu, Roman Urdu)
  if (
    text.match(/\b(hi|hello|hey|heya|hola|salam|assalam|aoa|slaam)\b/) ||
    text.includes("kese ho") ||
    text.includes("kaise ho") ||
    text.includes("kia hal") ||
    text.includes("kya hal") ||
    text.includes("kya haal") ||
    text.includes("theek ho") ||
    text.includes("sab theek") ||
    text.includes("how are you") ||
    text.includes("how r u") ||
    text.includes("whats up") ||
    text.includes("what's up") ||
    text.includes("sup")
  ) {
    if (text.includes("kese") || text.includes("kaise") || text.includes("kia hal") || text.includes("kya hal") || text.includes("how are you") || text.includes("theek ho")) {
      const replies = [
        "Alhamdulillah, main bilkul theek aur super active hoon! 🤖✨ ZakoraSocial par aapki madad k liye tayyar hoon. Aap sunayein, aaj ka din kaisa guzar raha hai?",
        "Main zabardast hoon! Shukriya poochne ka. 😊 Aaj aap ZakoraSocial par koi nayi post share karne ka soch rahe hain ya captions chahiye?",
        "I'm doing great and feeling energized! 🚀 How can I help you shine on ZakoraSocial today?"
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }
    const greetings = [
      "Hello there! 👋 Main hoon **Zakora's Agent**. Aapka din kaisa ja raha hai? Aaj koi nayi post banani hai ya captions chahiye?",
      "Walekum Assalam! 😊 Khush aamdeed! Main ZakoraSocial ka official assistant hoon. Batayein aaj main aapki kya madad kar sakta hoon?",
      "Hey! 🌟 Great to see you on ZakoraSocial! Ready to craft some engaging posts or brainstorm creative ideas?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 2. STATUS / WHAT ARE YOU DOING
  if (
    text.includes("kia kr rhy") ||
    text.includes("kya kar rahe") ||
    text.includes("kya kr rahe") ||
    text.includes("what are you doing") ||
    text.includes("what r u doing")
  ) {
    return (
      "Main ZakoraSocial par nayi posts k liye viral captions, trending hashtags aur creative ideas design kar raha hoon! 💡\n\n" +
      "Aap batayein, aaj aapka mood kaisa hai? Kisi post k liye caption chahiye ya profile bio set karni hai?"
    );
  }

  // 3. JOKES, ENTERTAINMENT & SHAYARI ("kuch sunao", "joke", "latifa", "shair", "poetry")
  if (
    text.includes("joke") ||
    text.includes("latifa") ||
    text.includes("chutkula") ||
    text.includes("kuch sunao") ||
    text.includes("kuch sunaen") ||
    text.includes("shair") ||
    text.includes("shayari") ||
    text.includes("poetry") ||
    text.includes("boring") ||
    text.includes("bore") ||
    text.includes("funny")
  ) {
    if (text.includes("shair") || text.includes("shayari") || text.includes("poetry")) {
      return (
        "Hazir hai ek khubsurat shair ZakoraSocial vibes k sath ✨:\n\n" +
        `*"Manzilen unhi ko milti hain jinke sapno me jaan hoti hai,*\n` +
        `*Pankh se kuch nahi hota, hoslon se udaan hoti hai!"* 🦅🌟\n\n` +
        "Kaisa laga? Agar aap is shair ko apni post me use karna chahein to ek zabardast caption ban sakta hai!"
      );
    }
    const jokes = [
      "Ek social media user doctor k pas gaya:\nDoctor: 'Aapko fresh air ki zaroorat hai.'\nUser: 'Doctor sahab, mere WiFi router ka fan chal to raha hai!' 😂📶",
      "Teacher: 'Homework kyun nahi kiya?'\nStudent: 'Sir, bijli chali gayi thi.'\nTeacher: 'To mombatti jala lete!'\nStudent: 'Sir, matchbox phone me save nahi hota!' 🤣📱",
      "Dost: 'Bhai, itni saari photos kyun click kar raha hai?'\nMe: 'ZakoraSocial par post bhi to karni hai, feed khaali achi nahi lagti!' 😉📸"
    ];
    return "Haha, yeh suniye! 😄\n\n" + jokes[Math.floor(Math.random() * jokes.length)];
  }

  // 4. EMOTIONAL / MOOD SHARING ("sad", "happy", "mood", "tension", "gussa", "tired")
  if (text.includes("sad") || text.includes("udas") || text.includes("upset") || text.includes("mood kharab")) {
    return (
      "Aww, udaas mat hon! ❤️ Zindagi me ups aur downs aate rehte hain. Kabhi kabhi ek choti si walk, favorite music ya dost se baat dil halka kar deti hai.\n\n" +
      "Ek deep breath lein, sab theek ho jayega! Aur agar aap chahein to main aapke liye ek positive, inspiring quote share karoon? ✨"
    );
  }

  if (text.includes("happy") || text.includes("khush") || text.includes("celebrat") || text.includes("party")) {
    return (
      "Bohat mubarak ho! 🎉 Khushi share karne se barhti hai! ZakoraSocial par apni is khushi ka lamha zarur share karein.\n\n" +
      "Agar aapko caption chahiye to batayein, main ek celebratory caption bana deta hoon! 🥳🥂"
    );
  }

  if (text.includes("birthday") || text.includes("salgirah")) {
    return (
      "🎂 **Happy Birthday! Salgirah Bohat Bohat Mubarak!** 🎈🎉\n\n" +
      "May your year be filled with blessings, success, and joyful memories!\n\n" +
      "Post caption idea:\n" +
      `*"Another year older, wiser, and more grateful for this beautiful journey. Thank you everyone for the love and warm wishes! 🎂✨ #BirthdayVibes #GratefulHeart #ZakoraSocial"*`
    );
  }

  // 5. PLATFORM HELP & HOW-TO (POSTING, FRIENDS, PROFILE, NOTIFICATIONS)
  // Handles all forms: "post kasy lagaown", "post khan sy ja kr lgat y hn", "how to post", "post kaise karein"
  if (
    (text.includes("post") && (text.includes("kasy") || text.includes("kaise") || text.includes("kesy") || text.includes("khan") || text.includes("kahan") || text.includes("kidhar") || text.includes("laga") || text.includes("lgat") || text.includes("lgaye") || text.includes("bana") || text.includes("karna") || text.includes("krun") || text.includes("how") || text.includes("where") || text.includes("share"))) ||
    text.includes("upload") ||
    text.includes("picture kaise") ||
    text.includes("video kaise") ||
    text.includes("photo kaise")
  ) {
    return (
      "📸 **ZakoraSocial par Post lagane ka tareeqa:**\n\n" +
      "1️⃣ Home Feed k sab se upar **'What's on your mind?'** box par click karein.\n" +
      "2️⃣ Agar image ya video lagani hai to neeche **Photo or Video** icon par click kar k file choose karein.\n" +
      "3️⃣ Apna text ya caption type karein (ya mujhse likhwa lein!).\n" +
      "4️⃣ Neelay (Blue) rang k **'Share'** button par click kar dein!\n\n" +
      "Aapki post foran feed par publish ho jayegi aur aapke friends uspar like aur comment kar sakenge! 🚀"
    );
  }

  if (
    text.includes("dost") ||
    text.includes("friend") ||
    text.includes("follow") ||
    text.includes("connect") ||
    text.includes("user find") ||
    text.includes("search")
  ) {
    return (
      "👥 **ZakoraSocial par Friends banane ka tareeqa:**\n\n" +
      "• **Search Bar:** Top bar me search box se kisi bhi dost ka username dhoondein.\n" +
      "• **Rightbar / Sidebar:** Right side par online dosto aur suggested users ki list dekhein.\n" +
      "• **Profile Follow:** Kisi bhi user ki profile par ja kar unhe **Follow** karein taake unki nayi posts aapki feed par nazar aayen!"
    );
  }

  if (text.includes("profile picture") || text.includes("dp") || text.includes("avatar") || text.includes("picture badal")) {
    return (
      "🖼️ **Profile Picture Change Karne Ka Tareeqa:**\n\n" +
      "1️⃣ Top right corner par apni profile icon par click kar k apni Profile page par jayein.\n" +
      "2️⃣ Profile image par hover kar k camera ya edit icon par click karein.\n" +
      "3️⃣ Nayi image choose karein aur save kar dein!"
    );
  }

  if (text.includes("notification") || text.includes("ghanti") || text.includes("bell")) {
    return (
      "🔔 **Notifications:**\n\n" +
      "Top bar me Bell icon par click kar k aap realtime notifications dekh sakte hain jab bhi koi aapki post ko like ya comment karega!"
    );
  }

  // 6. TOPIC-SPECIFIC POST CAPTIONS (AUTO-DETECT TOPICS)
  // Rain / Weather
  if (text.includes("rain") || text.includes("barish") || text.includes("baarish") || text.includes("weather") || text.includes("mosam") || text.includes("mausam")) {
    return (
      "🌧️ **Captions for Rainy / Pleasant Weather:**\n\n" +
      `1️⃣ "Cold breeze, warm coffee, and the soothing sound of rain. Perfect moments! ☕🌧️ #RainyVibes #ChaiAndRain #ZakoraSocial"\n` +
      `2️⃣ "Let the rain wash away all the noise. Nature's way of resetting. 🌿🌧️ #Petrichor #PeacefulVibes"\n` +
      `3️⃣ "Life isn't about waiting for the storm to pass, it's about learning to dance in the rain. 💃☔ #MonsoonDiaries"`
    );
  }

  // Coffee / Tea / Chai
  if (text.includes("coffee") || text.includes("chai") || text.includes("tea") || text.includes("cafe")) {
    return (
      "☕ **Captions for Coffee & Chai Lovers:**\n\n" +
      `1️⃣ "Behind every productive day is a great cup of coffee. ☕✨ #CoffeeFirst #MorningRitual #ZakoraSocial"\n` +
      `2️⃣ "Chai isn't just a drink, it's an emotion. Har ghont me sukoon! 🫖❤️ #ChaiLover #DesiVibes"\n` +
      `3️⃣ "Sip, breathe, and conquer the day ahead. ☕🚀 #CoffeeTime #PositiveVibes"`
    );
  }

  // Nature / Travel / Sunset / Outing
  if (text.includes("nature") || text.includes("travel") || text.includes("trip") || text.includes("sunset") || text.includes("safari") || text.includes("beach") || text.includes("pahar") || text.includes("mountain")) {
    return (
      "🌅 **Captions for Nature & Travel:**\n\n" +
      `1️⃣ "Chasing sunsets and making memories in places where WiFi is weak but connection is real. 🌄🌊 #Wanderlust #SunsetLover #ZakoraSocial"\n` +
      `2️⃣ "Nature never goes out of style. Taking in every bit of this breathtaking view! 🍃🏔️ #NatureVibes #ExploreMore"\n` +
      `3️⃣ "Collecting moments, not things. Another pin on the map! ✈️🗺️ #TravelDiaries #AdventureAwaits"`
    );
  }

  // Food / Dining / Cooking
  if (text.includes("food") || text.includes("khana") || text.includes("dinner") || text.includes("lunch") || text.includes("biryani") || text.includes("pizza") || text.includes("cooking")) {
    return (
      "🍕 **Captions for Foodies:**\n\n" +
      `1️⃣ "Good food = Good mood. The only drama I enjoy is in my spices! 🥘😋 #FoodieGram #DeliciousEats #ZakoraSocial"\n` +
      `2️⃣ "First we eat, then we do everything else. Certified foodie forever! 🍔🍟 #FoodLover #FoodPorn"\n` +
      `3️⃣ "Life is too short to skip dessert. Treating myself today! 🍰✨ #TreatYourself #Yum"`
    );
  }

  // Fitness / Gym / Workout
  if (text.includes("gym") || text.includes("workout") || text.includes("fitness") || text.includes("exercise") || text.includes("bodybuilding")) {
    return (
      "💪 **Captions for Gym & Fitness:**\n\n" +
      `1️⃣ "Hustle for that muscle. Progress over perfection, everyday! 🏋️‍♂️🔥 #GymMotivation #NoExcuses #ZakoraSocial"\n` +
      `2️⃣ "The pain you feel today will be the strength you feel tomorrow. Stay committed! 💪⚡ #FitnessJourney #WorkoutVibes"\n` +
      `3️⃣ "Your only limit is your mindset. Sweat today, shine tomorrow! 🏃‍♂️💨 #FitLife #GrindNeverStops"`
    );
  }

  // Coding / Tech / Developer
  if (text.includes("code") || text.includes("coding") || text.includes("developer") || text.includes("programming") || text.includes("tech") || text.includes("javascript") || text.includes("react") || text.includes("python")) {
    return (
      "💻 **Captions for Coders & Tech Enthusiasts:**\n\n" +
      `1️⃣ "Eat. Sleep. Code. Repeat. Turning coffee into clean code! ☕💻 #DevLife #WebDev #ZakoraSocial"\n` +
      `2️⃣ "There is no place like 127.0.0.1. Building modern web experiences step by step! 🌐⚡ #CodeLife #MERNStack"\n` +
      `3️⃣ "It works on my machine! Debugging mode: ON. 🐛🚀 #ProgrammerHumor #TechCreators"`
    );
  }

  // Friends / Friendship
  if (text.includes("friends") || text.includes("friendship") || text.includes("dosti") || text.includes("yaari") || text.includes("buddies")) {
    return (
      "🤝 **Captions for Friendship & Dosti:**\n\n" +
      `1️⃣ "Good times + Crazy friends = Unforgettable memories! 🌟❤️ #FriendsForLife #SquadGoals #ZakoraSocial"\n` +
      `2️⃣ "Dosti me no sorry, no thank you—sirf endless laughter aur crazy talks! 😂🍕 #Besties #DostiVibes"\n` +
      `3️⃣ "Rare to find, hard to leave, impossible to forget. Lucky to have my circle! 💫🙌 #TrueFriends #CherishedMoments"`
    );
  }

  // Motivation / Success / Mindset
  if (text.includes("motivation") || text.includes("success") || text.includes("mindset") || text.includes("inspire") || text.includes("quote") || text.includes("hard work")) {
    return (
      "🔥 **Inspiring Motivational Captions:**\n\n" +
      `1️⃣ "Believe in yourself and all that you are. Great things take time and consistency! 🌟🚀 #DailyMotivation #DreamBig #ZakoraSocial"\n` +
      `2️⃣ "Small daily improvements over time lead to stunning results. Keep pushing! ⚡📈 #GrowthMindset #Focus"\n` +
      `3️⃣ "Your journey is uniquely yours. Don't compare, just keep progressing! 💫💪 #SelfBelief #Unstoppable"`
    );
  }

  // Generic Caption Intent (e.g. "caption", "write a post", "post about [anything]")
  if (text.includes("caption") || text.includes("post about") || text.includes("write a post") || text.includes("write post") || text.includes("post likh")) {
    const topic = raw.replace(/write (a )?post (about )?|caption (for )?|post about |post likh k do|caption banao/gi, "").trim();
    const cleanTopic = topic || "Everyday Moments";
    const tag = cleanTopic.replace(/[^a-zA-Z0-9]/g, '');

    return (
      `✨ **Here are 3 engaging captions for "${cleanTopic}":**\n\n` +
      `1️⃣ "Finding beauty in the simplest moments. Living, learning, and thriving! 🌟 #${tag || 'Moments'} #ZakoraSocial"\n` +
      `2️⃣ "Life moves pretty fast. Make sure to pause and appreciate the journey. ✨💫 #${tag ? tag + 'Life' : 'GoodVibes'}"\n` +
      `3️⃣ "Creating stories I'll love to look back on. What's inspiring you today? 👇💬 #ZakoraVibes #DailyInspo"`
    );
  }

  // 7. HASHTAGS INTENT
  if (text.includes("hashtag") || text.includes("tags")) {
    const topic = raw.replace(/hashtag(s)? (for )?|generate tags (for )?/gi, "").trim();
    const tag = topic ? topic.replace(/\s+/g, '') : "SocialVibes";
    return (
      `🏷️ **Recommended Trending Hashtags for "${topic || "Social Post"}":**\n\n` +
      `#${tag} #${tag}Daily #TrendingNow #ExplorePage #ZakoraSocial #ContentCreators #CommunityFirst #GoodVibesOnly #DailyInspiration #ViralPosts`
    );
  }

  // 8. PROFILE BIO INTENT
  if (text.includes("bio") || text.includes("profile description")) {
    return (
      `📝 **3 Creative Profile Bios for ZakoraSocial:**\n\n` +
      `1️⃣ *"Dreamer • Creator • Explorer 🌍 | Sharing stories & positive energy ✨"*\n` +
      `2️⃣ *"Building things, learning daily, and connecting with curious minds. Let's talk! 🚀"*\n` +
      `3️⃣ *"Capturing candid moments through lenses and words 📸 | Coffee enthusiast & lifelong learner ☕"*`
    );
  }

  // 9. AZKA / CREATOR INTENT
  if (text.includes("azka") || text.includes("developer") || text.includes("creator") || text.includes("who built") || text.includes("who made")) {
    return (
      `👩‍💻 **About the Creator:**\n\n` +
      `ZakoraSocial was conceptualized and developed by **Azka**, a talented Full-Stack MERN Developer.\n\n` +
      `She engineered this platform using React, Node.js, Express, MongoDB Atlas, and integrated smart AI features to provide a smooth, engaging social experience! 🚀`
    );
  }

  // 10. WHO ARE YOU INTENT
  if (text.includes("who are you") || text.includes("tum kon ho") || text.includes("what are you") || text.includes("your name") || text.includes("apna intro")) {
    return (
      `🤖 I am **Zakora's Agent**, your official intelligent companion on ZakoraSocial!\n\n` +
      `I can help you with:\n` +
      `• ✍️ Writing catchy post captions for any topic or photo\n` +
      `• 💡 Brainstorming viral post ideas & interactive questions\n` +
      `• 🏷️ Generating trending hashtags to boost your reach\n` +
      `• 📝 Crafting custom bios for your profile\n` +
      `• 💬 Chatting, sharing jokes, quotes and answering questions about ZakoraSocial!`
    );
  }

  // 11. COMPLIMENTS & GRATITUDE ("shukriya", "thanks", "thank you", "nice", "zabardast", "good")
  if (
    text.includes("thank") ||
    text.includes("shukriya") ||
    text.includes("jazakallah") ||
    text.includes("dhanyawad") ||
    text.includes("zabardast") ||
    text.includes("bohat khoob") ||
    text.includes("nice") ||
    text.includes("great") ||
    text.includes("good job")
  ) {
    const thanksReplies = [
      "Aapka bohat shukriya! ❤️ Hamesha aapki madad k liye hazir hoon. Happy posting on ZakoraSocial! 🚀",
      "Anytime! 😊 Glad I could help. Agar koi aur caption ya idea chahiye ho to bas batayein!",
      "Most welcome! 🌟 Keep spreading positive vibes on ZakoraSocial!"
    ];
    return thanksReplies[Math.floor(Math.random() * thanksReplies.length)];
  }

  // 12. FAREWELLS ("bye", "allah hafiz", "good night", "tata")
  if (text.includes("bye") || text.includes("allah hafiz") || text.includes("khuda hafiz") || text.includes("good night") || text.includes("see you")) {
    return "Allah Hafiz! 👋 Apna khayal rakhiyega aur ZakoraSocial par naye doston k sath connected rahiyega. Phir baat hogi! ✨";
  }

  // 13. CONVERSATIONAL FALLBACK (Clean, natural, and never creates awkward quotes)
  if (
    text.includes("?") ||
    text.includes("kya") ||
    text.includes("kia") ||
    text.includes("kaise") ||
    text.includes("kasy") ||
    text.includes("khan") ||
    text.includes("kahan") ||
    text.includes("kidhar") ||
    text.includes("bata") ||
    text.includes("help") ||
    text.includes("madad") ||
    text.includes("how") ||
    text.includes("what") ||
    text.includes("where") ||
    text.includes("why")
  ) {
    return (
      "Main **Zakora's Agent** hoon! 😊 Main ZakoraSocial par aapki poori rehnumai k liye tayyar hoon.\n\n" +
      "Aap mujh se poochna chahein to:\n" +
      "• 📸 **Post lagana:** Home feed k upar 'What's on your mind?' se lagti hai.\n" +
      "• ✍️ **Captions:** Kisi bhi topic (nature, travel, rain, friends wagera) par zabardast captions.\n" +
      "• 🏷️ **Hashtags:** Apni post ko reach dilane k liye trending hashtags.\n" +
      "• 💡 **Post Ideas:** Creative content ideas apne doston k sath share karne k liye!\n\n" +
      "Aap mujh se mazeed kya poochna chahti hain?"
    );
  }

  // If user typed a topic or statement:
  return (
    `Main **"${raw}"** k hawalay se aapki post tayyar kar sakta hoon! 🌟\n\n` +
    `Agar aapko is par captions ya ideas chahiyein, to mujh se bejhijhak kahiye, main foran create kar doonga!`
  );
}

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  const geminiApiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

  if (geminiApiKey && geminiApiKey !== "") {
    try {
      const systemInstruction = 
        "You are Zakora's Agent, a friendly, intelligent, and helpful AI assistant embedded in the ZakoraSocial platform. " +
        "Help users explore ZakoraSocial features, craft engaging posts, write catchy captions, recommend trending hashtags, brainstorm content ideas, write bios, and answer questions warmly and concisely in English, Roman Urdu, or Urdu depending on what the user speaks.";

      const contents = [];
      if (Array.isArray(history)) {
        history.slice(-6).forEach((h) => {
          if (h.role && h.text) {
            contents.push({
              role: h.role === "assistant" ? "model" : "user",
              parts: [{ text: h.text }]
            });
          }
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      // Use Google Gemini 3.6 Flash model
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        },
        { timeout: 25000 }
      );

      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        return res.status(200).json({ reply });
      }
    } catch (err) {
      console.warn("Gemini API call failed:", err.response?.data?.error?.message || err.message);
    }
  }

  // Fallback to local intelligent assistant engine
  const reply = generateLocalAiResponse(message);
  return res.status(200).json({ reply });
});

module.exports = router;

