"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GST_RATE_MAP = exports.OPEN_FOOD_FACTS_URL = void 0;
exports.inferGstClass = inferGstClass;
exports.OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product';
exports.GST_RATE_MAP = {
    EXEMPT: 0,
    GST_5: 5,
    GST_12: 12,
    GST_18: 18,
    GST_28: 28,
};
function inferGstClass(categories) {
    const c = categories.toLowerCase();
    if (c.includes('beverage') || c.includes('aerated') || c.includes('cola') || c.includes('soda'))
        return 'GST_28';
    if (c.includes('biscuit') || c.includes('pasta') || c.includes('noodle') || c.includes('ice cream') || c.includes('chocolate'))
        return 'GST_18';
    if (c.includes('juice') || c.includes('butter') || c.includes('cheese') || c.includes('ghee') || c.includes('namkeen'))
        return 'GST_12';
    if (c.includes('oil') || c.includes('sugar') || c.includes('spice') || c.includes('tea') || c.includes('coffee') || c.includes('packed'))
        return 'GST_5';
    return 'EXEMPT';
}
//# sourceMappingURL=gst.utils.js.map