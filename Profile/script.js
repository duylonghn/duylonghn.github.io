let currentLang = 'vi'; // Ngôn ngữ mặc định

document.addEventListener('DOMContentLoaded', function () {
    changeLanguage(currentLang); // Load toàn bộ nội dung ban đầu
});

function changeLanguage(lang) {
    currentLang = lang;

    // Hiển thị phần tử theo ngôn ngữ
    document.querySelectorAll('.vi, .en').forEach(el => {
        el.style.display = el.classList.contains(lang) ? '' : 'none';
    });

    loadExperience(lang);
    loadProjects(lang);
}

function loadExperience(lang) {
    fetch('experience.json')
        .then(res => res.json())
        .then(data => renderExperience(data[lang]))
        .catch(err => console.error('Lỗi khi tải dữ liệu kinh nghiệm:', err));
}

function renderExperience(experiences) {
    const container = document.getElementById('experience-list');
    container.innerHTML = '';

    experiences.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('item');
        div.innerHTML = `
            <h4>${item.role}</h4>
            <div class="time">
                <span style="font-weight: bold;">${item.company}<br></span>
                <span>${item.time}</span>
            </div>
            <div class="des">${item.description.replace(/\n/g, "<br>")}</div>
        `;
        container.appendChild(div);
    });
}

function loadProjects(lang) {
    const container = document.querySelector('.project');
    if (!container) return;

    fetch('projects.json')
        .then(res => res.json())
        .then(data => renderProjects(data[lang], container))
        .catch(err => {
            console.error('Lỗi khi tải dữ liệu dự án:', err);
            container.innerHTML = '<p>Lỗi tải dự án.</p>';
        });
}

function renderProjects(projects, container) {
    let html = `<h2>${currentLang === 'vi' ? 'DỰ ÁN' : 'PROJECTS'}</h2>`;

    projects.forEach(project => {
        html += `<div class="item">`;
        if (project.name) {
            html += `<h4>${project.name}</h4>`;
        }
        if (project.time) {
            html += `<div class="time">${project.time}</div>`;
        }
        if (project.web) {
            const url = project.web.startsWith('http') ? project.web : 'https://' + project.web;
            html += `
            <div class="web">
                <a href="${url}" target="_blank">${project.web}</a>
            </div>
            `;
        }
        if (project.location) {
            html += `<div class="location">${project.location}</div>`;
        }
        if (project.description || (project.features && project.features.length > 0)) {
            if (project.description) {
                html += `<div class="des">${project.description}</div>`;
            }
            if (project.features && project.features.length > 0) {
                html += `<ul>${project.features.map(f => `<li>${f}</li>`).join('')}</ul>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
    });
    container.innerHTML = html;
}


function download() {
    const filePath = currentLang === 'vi'
        ? 'templates/Đào Duy Long.pdf'
        : 'templates/Duy Long Dao.pdf';

    const fileName = currentLang === 'vi'
        ? 'Đào Duy Long.pdf'
        : 'Duy Long Dao.pdf';

    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

document.addEventListener('wheel', function (e) {
    if (e.ctrlKey) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
    }
});
