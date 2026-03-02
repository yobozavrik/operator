from playwright.sync_api import sync_playwright

def run(playwright):
    print("Запуск браузера...")
    # headless=False открывает видимое окно браузера для пользователя
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto("https://live.grade.app/account/employees")
    
    print("Браузер открыт! Пожалуйста, авторизуйся в окне браузера.")
    print("У тебя есть 90 секунд на вход и переход к нужным данным...")
    
    # Ждем 90 секунд, чтобы пользователь успел ввести логин и пароль
    page.wait_for_timeout(90000)
    
    print("Время вышло, делаю скриншот и собираю структуру страницы...")
    page.screenshot(path="grade_app_analysis.png", full_page=True)
    
    with open("grade_app_source.html", "w", encoding="utf-8") as f:
        f.write(page.content())
        
    browser.close()
    print("Анализ завершен, браузер закрыт. Файлы grade_app_analysis.png и grade_app_source.html сохранены.")

with sync_playwright() as playwright:
    run(playwright)
