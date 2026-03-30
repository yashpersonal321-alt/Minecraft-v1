import * as THREE from 'three';
import { NPC } from './NPC.js';

export class NPCManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.npcs = [];
        this.npcCount = 15;
    }
    
    async spawnNPCs() {
        const npcTypes = ['villager', 'farmer', 'blacksmith', 'lumberjack', 'miner'];
        
        for (let i = 0; i < this.npcCount; i++) {
            // NPC के लिए जगह ढूंढें
            let x, z, y;
            let attempts = 0;
            
            do {
                x = (Math.random() - 0.5) * 160;
                z = (Math.random() - 0.5) * 160;
                y = this.world.getHeight(Math.floor(x), Math.floor(z));
                attempts++;
                if (attempts > 50) break;
            } while (y < 60);
            
            const type = npcTypes[Math.floor(Math.random() * npcTypes.length)];
            const name = this.generateNPCName(type);
            const dialog = this.generateDialog(type);
            
            const npc = new NPC(this.scene, {
                type: type,
                name: name,
                position: { x: x, y: y + 1, z: z },
                dialog: dialog,
                dialogColor: this.getDialogColor(type)
            });
            
            await npc.create();
            this.npcs.push(npc);
        }
        
        console.log(`${this.npcs.length} NPCs spawned`);
    }
    
    generateNPCName(type) {
        const firstNames = ['राजू', 'मोहन', 'श्याम', 'रामू', 'भोला', 'चंदू', 'मुन्ना', 'बबलू'];
        const lastNames = ['सिंह', 'गुप्ता', 'शर्मा', 'वर्मा', 'यादव', 'कुमार'];
        const professionNames = {
            villager: ['ग्रामीण', 'दयालु', 'शांत'],
            farmer: ['किसान', 'हलवाहा', 'अन्नदाता'],
            blacksmith: ['लोहार', 'धातुकार', 'अग्निपुत्र'],
            lumberjack: ['लकड़हारा', 'वनरक्षक', 'काठवाला'],
            miner: ['खानी', 'रत्नेश', 'गुफानिवासी']
        };
        
        const first = firstNames[Math.floor(Math.random() * firstNames.length)];
        const prof = professionNames[type][Math.floor(Math.random() * professionNames[type].length)];
        return `${first} ${prof}`;
    }
    
    generateDialog(type) {
        const dialogs = {
            villager: [
                "नमस्ते! हमारे गाँव में आपका स्वागत है!",
                "यहाँ का मौसम बहुत अच्छा है न?",
                "क्या आपको घास के ब्लॉक मिले? मुझे कुछ चाहिए थे।",
                "रात होने वाली है, सावधान रहना!"
            ],
            farmer: [
                "मेरे खेत देखो कितने हरे-भरे हैं!",
                "गेहूँ की फसल अच्छी हुई इस बार।",
                "क्या आपको गेहूँ के बीज चाहिए?",
                "सूरज निकलते ही खेत पर काम शुरू कर देना चाहिए।"
            ],
            blacksmith: [
                "मेरी लोहे की चीज़ें सबसे मजबूत होती हैं!",
                "डायमंड आर्मर बनाना चाहोगे? लाओ सामान।",
                "तलवार धार करनी हो तो बता देना।",
                "ये लोहा कितना गर्म है, देखना मत छू लेना।"
            ],
            lumberjack: [
                "जंगल में बहुत पेड़ हैं, पर काटना मना है।",
                "लकड़ी चाहिए? मेरे पास बढ़िया सागौन है।",
                "पेड़ लगाओ, पर्यावरण बचाओ!",
                "ये ओक के पेड़ कितने पुराने हैं, पता है?"
            ],
            miner: [
                "गुफाओं में डायमंड छिपे हैं, जाओ ढूंढ़ो!",
                "कोल मिला? रात में काम आएगा।",
                "लावा से दूर रहना, बहुत खतरनाक है।",
                "गहराई में जाओगे तो अच्छी चीज़ें मिलेंगी।"
            ]
        };
        
        const options = dialogs[type] || dialogs.villager;
        return options[Math.floor(Math.random() * options.length)];
    }
    
    getDialogColor(type) {
        const colors = {
            villager: '#88ff88',
            farmer: '#88ffaa',
            blacksmith: '#ff8866',
            lumberjack: '#aa8866',
            miner: '#ffaa66'
        };
        return colors[type] || '#ffffff';
    }
    
    update(deltaTime, playerPos) {
        this.npcs.forEach(npc => {
            npc.update(deltaTime, playerPos);
            
            // NPC से बातचीत की दूरी चेक करें
            const dist = npc.getDistanceTo(playerPos);
            if (dist < 3) {
                this.showNPCDialog(npc);
            }
        });
    }
    
    showNPCDialog(npc) {
        const dialogBox = document.getElementById('npc-dialog');
        const dialogText = document.getElementById('dialog-text');
        
        if (dialogBox && dialogText) {
            dialogText.innerText = `${npc.name}: "${npc.getRandomDialog()}"`;
            dialogText.style.color = npc.dialogColor;
            dialogBox.classList.remove('hidden');
            
            // 5 सेकंड बाद ऑटो हाइड
            if (this.dialogTimeout) clearTimeout(this.dialogTimeout);
            this.dialogTimeout = setTimeout(() => {
                dialogBox.classList.add('hidden');
            }, 5000);
        }
    }
  }
