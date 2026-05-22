const fs = require('fs');
const path = require('path');
const jsonPath = path.join(__dirname, 'shipping-companies.json');

const getShippingCompaniesList = () => {
    if (!fs.existsSync(jsonPath)) {
        const defaults = [
            { id: "yurtici", name: "Yurtiçi Kargo", logo: "🚚", basePrice: 35, deliveryTime: "1-3 İş Günü" },
            { id: "aras", name: "Aras Kargo", logo: "⚡", basePrice: 30, deliveryTime: "2-4 İş Günü" },
            { id: "mng", name: "MNG Kargo", logo: "📦", basePrice: 25, deliveryTime: "3-5 İş Günü" }
        ];
        fs.writeFileSync(jsonPath, JSON.stringify(defaults, null, 2));
        return defaults;
    }
    try {
        return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
        return [];
    }
};

const saveShippingCompaniesList = (data) => {
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
};

const getShippingCompanies = async (req, res) => {
    try {
        const list = getShippingCompaniesList();
        return res.json({ success: true, data: list });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Kargo firmaları yüklenemedi.' });
    }
};

const createShippingCompany = async (req, res) => {
    try {
        const { name, logo, basePrice, deliveryTime } = req.body;
        if (!name || !logo) {
            return res.status(400).json({ success: false, message: 'İsim ve logo alanları zorunludur.' });
        }

        const list = getShippingCompaniesList();
        const newCompany = {
            id: name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-4),
            name,
            logo,
            basePrice: parseFloat(basePrice) || 0,
            deliveryTime: deliveryTime || '2-3 İş Günü'
        };

        list.push(newCompany);
        saveShippingCompaniesList(list);

        return res.status(201).json({ success: true, data: newCompany });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Kargo firması oluşturulamadı.' });
    }
};

const deleteShippingCompany = async (req, res) => {
    try {
        const { id } = req.params;
        let list = getShippingCompaniesList();
        const exists = list.some(item => item.id === id);
        if (!exists) {
            return res.status(404).json({ success: false, message: 'Kargo firması bulunamadı.' });
        }

        list = list.filter(item => item.id !== id);
        saveShippingCompaniesList(list);

        return res.json({ success: true, message: 'Kargo firması silindi.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Kargo firması silinemedi.' });
    }
};

const updateShippingCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, logo, basePrice, deliveryTime, isActive } = req.body;
        
        let list = getShippingCompaniesList();
        const index = list.findIndex(item => item.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Kargo firması bulunamadı.' });
        }

        const updatedCompany = {
            ...list[index],
            name: name !== undefined ? name : list[index].name,
            logo: logo !== undefined ? logo : list[index].logo,
            basePrice: basePrice !== undefined ? parseFloat(basePrice) : list[index].basePrice,
            deliveryTime: deliveryTime !== undefined ? deliveryTime : list[index].deliveryTime,
            isActive: isActive !== undefined ? isActive : (list[index].isActive !== undefined ? list[index].isActive : true)
        };

        list[index] = updatedCompany;
        saveShippingCompaniesList(list);

        return res.json({ success: true, data: updatedCompany });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Kargo firması güncellenemedi.' });
    }
};

module.exports = {
    getShippingCompanies,
    createShippingCompany,
    deleteShippingCompany,
    updateShippingCompany
};
