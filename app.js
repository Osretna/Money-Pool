// --- إعدادات الفيربيس (ضع كودك هنا) ---
const firebaseConfig = {
    apiKey: "AIzaSyCd5-UDz-bhePiUWqayXjUe8Kd6L0Yvxak",
  authDomain: "games-2048-cc14a.firebaseapp.com",
  projectId: "games-2048-cc14a",
  storageBucket: "games-2048-cc14a.firebasestorage.app",
  messagingSenderId: "403132766713",
  appId: "1:403132766713:web:315352e90f39c4939ec528",
  measurementId: "G-JPDG96L486"
};
// تهيئة فيربيس
  firebase.initializeApp(firebaseConfig);
  
  // الآن السطر الذي سألت عنه سيعمل
  const db = firebase.firestore();

// بيانات تجريبية (سيتم استبدالها بالفيربيس)
let associations = JSON.parse(localStorage.getItem('myAssocs')) || [];
let currentAssocIndex = null;

// --- التنقل الذكي ---
function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    localStorage.setItem('currentPage', id);
    if(id === 'home') renderHome();
}

// --- عرض الجمعيات في الرئيسية ---
function renderHome() {
    const grid = document.getElementById('assoc-grid');
    grid.innerHTML = associations.map((assoc, index) => `
        <div class="assoc-card" style="position:relative;" onclick="openAssoc(${index})">
            <button class="delete-assoc-btn" onclick="deleteAssociation(${index}, event)">×</button>
            <h3>${assoc.name}</h3>
            <p>💰 القسط: ${assoc.amount} ج.م</p>
            <p>📅 المدة: ${assoc.months} شهر</p>
            <p>👥 الأعضاء: ${assoc.members.length} / ${assoc.months}</p>
        </div>
    `).join('');
}

// --- فتح جمعية محددة ---
function openAssoc(index) {
    currentAssocIndex = index;
    const assoc = associations[index];
    document.getElementById('selected-assoc-title').innerText = assoc.name;
    document.getElementById('total-pool').innerText = `إجمالي القبض: ${assoc.amount * assoc.months} ج.م`;
    renderMembers();
    showSection('manage-single');
    localStorage.setItem('currentAssocIdx', index);
}

// --- إضافة جمعية ---
function createNewAssoc() {
    const newObj = {
        name: document.getElementById('nameInp').value,
        amount: document.getElementById('amountInp').value,
        months: document.getElementById('monthsInp').value,
        startDate: document.getElementById('dateInp').value,
        members: []
    };
    associations.push(newObj);
    saveData();
    showSection('home');
}

// تعديل دالة إضافة عضو لتشمل إعادة الحساب
function addMember() {
    const name = document.getElementById('memberName').value;
    if(!name) return;
    
    const assoc = associations[currentAssocIndex];
    assoc.members.push({
        name: name,
        isPaid: false
    });

    recalculateMonths();
    saveData();
    renderMembers();
    document.getElementById('memberName').value = "";
}

// --- دالة القرعة (Shuffle) ---
function runLottery() {
    if (!confirm("هل أنت متأكد من إعادة ترتيب الأسماء عشوائياً؟")) return;
    
    let assoc = associations[currentAssocIndex];
    let members = assoc.members;

    // خوارزمية Fisher-Yates للترتيب العشوائي
    for (let i = members.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [members[i], members[j]] = [members[j], members[i]];
    }

    recalculateMonths(); // إعادة حساب الشهور بناءً على الترتيب الجديد
    saveData();
    renderMembers();
}

// --- إعادة حساب الشهور بناءً على الترتيب ---
function recalculateMonths() {
    let assoc = associations[currentAssocIndex];
    let startDate = new Date(assoc.startDate);
    
    assoc.members.forEach((member, index) => {
        let currentMonth = new Date(startDate);
        currentMonth.setMonth(startDate.getMonth() + index);
        member.payoutMonth = currentMonth.toLocaleString('ar-EG', {month: 'long', year: 'numeric'});
        member.monthKey = currentMonth.getMonth() + "-" + currentMonth.getFullYear(); // للمقارنة
    });
}

// --- الترتيب اليدوي (لأعلى ولأسفل) ---
function moveMember(index, direction) {
    let members = associations[currentAssocIndex].members;
    if (direction === 'up' && index > 0) {
        [members[index], members[index - 1]] = [members[index - 1], members[index]];
    } else if (direction === 'down' && index < members.length - 1) {
        [members[index], members[index + 1]] = [members[index + 1], members[index]];
    }
    recalculateMonths();
    saveData();
    renderMembers();
}

// --- عرض المشتركين مع ميزة "من عليه الدور" ---
function renderMembers() {
    const tbody = document.getElementById('members-table-body');
    const assoc = associations[currentAssocIndex];
    const today = new Date();
    const currentMonthKey = today.getMonth() + "-" + today.getFullYear();

    // 1. حساب إجمالي ما تم تحصيله فعلياً من الجميع هذا الشهر
    const paidMembersCount = assoc.members.filter(m => m.isPaid).length;
    const actualCollectedAmount = paidMembersCount * assoc.amount;
    
    // 2. إجمالي المبلغ المفترض تحصيله (الهدف النهائي)
    const targetAmount = assoc.members.length * assoc.amount;

    tbody.innerHTML = assoc.members.map((m, i) => {
        const isCurrentRecipient = (m.monthKey === currentMonthKey);

        return `
        <tr class="${isCurrentRecipient ? 'current-payout' : ''}">
            <td>${i + 1}</td>
            <td style="font-weight:bold;">${m.name} ${isCurrentRecipient ? '⭐' : ''}</td>
            <td><span class="badge">${m.payoutMonth}</span></td>
            
            <td>
                ${isCurrentRecipient ? 
                    `<!-- إذا كان هذا الشخص هو المستلم الحالي -->
                    <div class="payout-box">
                        <small>تم تجميع:</small>
                        <div style="font-size: 1.1rem; color: #2ecc71; font-weight: bold;">
                            ${actualCollectedAmount} ج.م
                        </div>
                        <small style="color: #ccc;">من أصل ${targetAmount}</small>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(actualCollectedAmount/targetAmount)*100}%"></div>
                        </div>
                    </div>` 
                    : 
                    `<!-- باقي الأعضاء يظهر لهم القسط المطلوب منهم -->
                    <div style="color: #ddd;">القسط: ${assoc.amount} ج.م</div>`
                }
            </td>

            <td>تحصيل: 5 / قبض: 10</td>
            <td>
                <button class="reorder-btn" onclick="moveMember(${i}, 'up')">🔼</button>
                <button class="reorder-btn" onclick="moveMember(${i}, 'down')">🔽</button>
            </td>
            <td>
                <button class="status-btn" onclick="togglePaid(${i})" 
                    style="background:${m.isPaid ? '#27ae60' : '#e67e22'}; width: 100%; border-radius: 5px; border:none; color:white; padding: 5px; cursor:pointer;">
                    ${m.isPaid ? '✅ تم التحصيل' : '⏳ انتظار'}
                </button>
            </td>
            <td>
                <button class="op-btn edit" onclick="editMember(${i})" title="تعديل">✏️</button>
                <button class="op-btn delete" onclick="deleteMember(${i})" title="حذف">🗑️</button>
            </td>
        </tr>
        `;
    }).join('');
}

// تعديل اسم عضو
function editMember(index) {
    const assoc = associations[currentAssocIndex];
    const oldName = assoc.members[index].name;
    const newName = prompt("تعديل اسم المشترك:", oldName);
    
    if (newName && newName !== oldName) {
        assoc.members[index].name = newName;
        saveData();
        renderMembers();
    }
}

// حذف عضو
function deleteMember(index) {
    if (confirm("هل أنت متأكد من حذف هذا العضو؟ سيتم إعادة ترتيب الشهور تلقائياً.")) {
        associations[currentAssocIndex].members.splice(index, 1);
        recalculateMonths(); // إعادة حساب الشهور بعد الحذف
        saveData();
        renderMembers();
    }
}

// حذف الجمعية بالكامل (توضع في الصفحة الرئيسية)
function deleteAssociation(index, event) {
    event.stopPropagation(); // لمنع فتح الجمعية عند الضغط على حذف
    if (confirm("هل أنت متأكد من حذف الجمعية بالكامل؟ لا يمكن التراجع!")) {
        associations.splice(index, 1);
        saveData();
        renderHome();
    }
}

function togglePaid(memberIdx) {
    associations[currentAssocIndex].members[memberIdx].isPaid = !associations[currentAssocIndex].members[memberIdx].isPaid;
    saveData();
    renderMembers();
}

// حفظ البيانات في السحاب
function saveData() {
    // حفظ محلي للسرعة
    localStorage.setItem('myAssocs', JSON.stringify(associations));
    
    // حفظ في فيربيس (سحابي)
    // نفترض أننا نستخدم مستخدم واحد حالياً
    db.collection('settings').doc('allData').set({
        associations: associations
    }).then(() => {
        console.log("تم المزامنة مع السحابة ✅");
    });
}

// عند التحديث: العودة لنفس المكان
// تحميل البيانات عند فتح التطبيق
window.onload = () => {
    // أولاً: استرجاع الصفحة الأخيرة
    const lastPage = localStorage.getItem('currentPage');
    const lastIdx = localStorage.getItem('currentAssocIdx');

    // ثانياً: جلب البيانات من فيربيس
    db.collection('settings').doc('allData').get().then((doc) => {
        if (doc.exists) {
            associations = doc.data().associations;
            
            // بعد جلب البيانات، نقرر أين نقف
            if (lastPage === 'manage-single' && lastIdx !== null) {
                openAssoc(parseInt(lastIdx));
            } else {
                showSection(lastPage || 'home');
            }
        }
    });
};

// --- تصدير إكسيل ---
function exportData() {
    const assoc = associations[currentAssocIndex];
    
    // تجهيز البيانات بشكل منظم للأكسيل
    const excelData = assoc.members.map((m, i) => ({
        "م": i + 1,
        "اسم المشترك": m.name,
        "شهر القبض": m.payoutMonth,
        "المبلغ الشهري": assoc.amount,
        "حالة الدفع": m.isPaid ? "تم الدفع" : "لم يدفع بعد",
        "تاريخ التحصيل الأقصى": "يوم 5 في الشهر",
        "تاريخ القبض": "يوم 10 في الشهر"
    }));

    // إضافة سطر ملخص في النهاية
    const paidCount = assoc.members.filter(x => x.isPaid).length;
    excelData.push({}); // سطر فارغ
    excelData.push({
        "اسم المشترك": "الإجمالي المحصل لهذا الشهر",
        "شهر القبض": paidCount * assoc.amount + " ج.م"
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "بيانات الجمعية");
    
    // تحميل الملف باسم الجمعية
    XLSX.writeFile(wb, `تقرير_جمعية_${assoc.name}.xlsx`);
}