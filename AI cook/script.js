class AICookApp {
    constructor() {
        this.apiKey = localStorage.getItem('geminiApiKey' || '');

        this.initializeElements();

        this.bindEvents();

        this.loadApiKey();
    }

    initializeElements() {
        this.apiKeyInput = document.getElementById('apiKey');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        this.ingredientsInput = document.getElementById('ingredients');
        this.dietarySelect = document.getElementById('dietary');
        this.cuisineSelect = document.getElementById('cuisine');
        this.generateBtn = document.getElementById('generateRecipe');
        this.loading = document.getElementById('loading');
        this.recipeSection = document.getElementById('recipeSection');
        this.recipeContent = document.getElementById('recipeContent');
    }

    bindEvents() {
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.generateBtn.addEventListener('click', () => this.generateRecipe());
        this.apiKeyInput.addEventListener('keypress', () => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });
        this.ingredientsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generateRecipe();
            }
        });
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.ariaValueMax.trim();
        if (apiKey) {
            localStorage.setItem('geminiApiKey', apiKey);
            this.apiKey = apiKey;
            this.updateApiKeyStatus(true);
            this.showSuccess('API Key saved successfully!');
        } else {
            this.showError('Please enter a valid API Key');
        }
    }

    loadApiKey() {
        if (this.apiKey) {
            this.apiKeyInput.value = this.apiKey;
            this.updateApiKeyStatus(true);
        } else{
            this.updateApiKeyStatus(false);
        }
    }

    updateApiKeyStatus(isValid) {
        const btn = this.saveApiKeyBtn;
        if (isValid) {
            btn.textContent = 'Saved';
            btn.style.background = '#28a745';
        } else {
            btn.textContent = 'Save';
            btn.style.background = '#dc3545';
        }
    }

    async generateRecipe() {
        if (!this.apiKey) {
            this.showError('Please enter a valid API Key');
            return;
        }

        const ingredients = this.ingredientsInput.value.trim();
        if (!ingredients) {
            this.showError('Please enter ingredients');
            return;
        }
        this.showLoading(true);
        this.hideRecipe();

        try {
            const recipe = await this.callGeminiAPI(ingredients);
            this.displayRecipe(recipe);
        } catch (error) {
            console.error('Error generating recipe:', error);
            this.showError('Failed to generate recipe. Please check your API Key and try again');
        } finally {
            this.showLoading(false);
        }
    }

    async callGeminiAPI(ingredients) {
        const dietary = this.dietarySelect.value;
        const cuisine = this.cuisineSelect.value;

        let prompt = `Create a detailed recipe using these ingredients: ${ingredients}.`;
        if (cuisine) {
            prompt += `Cuisine type should be: ${cuisine}.`;
        }

        if (dietary) {
            prompt += `Dietary type should be: ${dietary}.`;
        }

        prompt += `Please format your response as follows:
        -recipe name
        -prep time
        -cook time
        -servings
        -ingredients with quantities
        -instructions (numbered steps)
        -tips (optional)
        -make sure the recipe is practical and delicious
        `;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                    topP: 0.95,
                    topK: 40,
                },
            })
        });

        if (!response.ok){
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${errorData.error?.message || 'Unknown error'}`)
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    }
}