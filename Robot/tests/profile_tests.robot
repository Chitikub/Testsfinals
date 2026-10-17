*** Settings ***
Documentation       US-09 profile scenarios ported from the Playwright suite.

Library             SeleniumLibrary    timeout=10 seconds
Library             OperatingSystem
Library             Collections

Suite Setup         Create Test Browser
Suite Teardown      Close All Browsers
Test Setup          Open Profile


*** Variables ***
${BASE_URL}                 %{BASE_URL=https://moodlocation.vercel.app}
${FIRST_NAME_INPUT}         xpath=(//input[@type="text"])[1]
${LAST_NAME_INPUT}          xpath=(//input[@type="text"])[2]
${GENDER_INPUT}             css:select
${FILE_INPUT}               css:input[type="file"]
${EMAIL_INPUT}              css:input[type="email"]
${PROFILE_HEADING}          xpath=//h2[contains(@class, "text-center")]
${SAVE_BUTTON}              //button[normalize-space(.)="บันทึกการเปลี่ยนแปลง"]
${ALERT_TITLE}              css:.swal2-title
${ALERT_TEXT}               css:.swal2-html-container
${ORIGINAL_FIRST_NAME}      Robot
${ORIGINAL_LAST_NAME}       Test


*** Test Cases ***
TC_9_0_001 Partial Profile Update
    [Documentation]    Saving a changed first name updates the profile and sends one mocked API request.
    Input Text    ${FIRST_NAME_INPUT}    Chitipat
    Click Element    ${SAVE_BUTTON}
    Wait Until Element Is Visible    ${ALERT_TITLE}
    Element Text Should Be    ${ALERT_TITLE}    อัปเดตข้อมูลเรียบร้อย!
    ${expected_heading}=    Catenate    SEPARATOR=${SPACE}    Chitipat    ${ORIGINAL_LAST_NAME}
    Element Text Should Be    ${PROFILE_HEADING}    ${expected_heading}
    ${request_count}=    Execute JavaScript    return window.__us09Requests.length;
    Should Be Equal As Integers    ${request_count}    1

TC_9_0_002 Update All Editable Profile Fields
    [Documentation]    First name, last name, and gender are saved together.
    Input Text    ${FIRST_NAME_INPUT}    Chitipat
    Input Text    ${LAST_NAME_INPUT}    Churhor
    Select From List By Value    ${GENDER_INPUT}    female
    ${selected_gender}=    Get Selected List Value    ${GENDER_INPUT}
    Click Element    ${SAVE_BUTTON}
    Wait Until Element Is Visible    ${ALERT_TITLE}
    Element Text Should Be    ${ALERT_TITLE}    อัปเดตข้อมูลเรียบร้อย!
    Element Text Should Be    ${PROFILE_HEADING}    Chitipat Churhor
    ${submitted}=    Execute JavaScript    return window.__us09Requests[0].submittedValues;
    Should Be Equal    ${submitted}[firstName]    Chitipat
    Should Be Equal    ${submitted}[lastName]    Churhor
    Should Be Equal    ${submitted}[gender]    ${selected_gender}

TC_9_0_003 Change Profile Image
    [Documentation]    A valid small PNG is previewed and saved as the profile image.
    ${png}=    Evaluate
    ...    __import__('base64').b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l7cAAAAASUVORK5CYII=')
    ${path}=    Join Path    ${TEMPDIR}    robot-profile-avatar.png
    Create Binary File    ${path}    ${png}
    Reveal Profile Image Input
    Choose File    ${FILE_INPUT}    ${path}
    Wait Until Keyword Succeeds    5 seconds    200 milliseconds    Preview Should Be Data URL
    Click Element    ${SAVE_BUTTON}
    Wait Until Element Is Visible    ${ALERT_TITLE}
    Element Text Should Be    ${ALERT_TITLE}    อัปเดตข้อมูลเรียบร้อย!
    ${profile_image}=    Execute JavaScript    return JSON.parse(localStorage.getItem("user")).profileImage;
    Should Be Equal    ${profile_image}    https://example.com/profile.png
    Remove File    ${path}

TC_9_0_004 Reject Missing First Name
    [Documentation]    Whitespace-only first name shows validation and does not send a request.
    ${whitespace}=    Set Variable    ${SPACE}${SPACE}${SPACE}
    Input Text    ${FIRST_NAME_INPUT}    ${whitespace}
    Click Element    ${SAVE_BUTTON}
    Wait Until Element Is Visible    ${ALERT_TEXT}
    Element Text Should Be    ${ALERT_TEXT}    กรุณากรอกชื่อ
    ${request_count}=    Execute JavaScript    return window.__us09Requests.length;
    Should Be Equal As Integers    ${request_count}    0

TC_9_0_005 Reject Non-Image Upload
    [Documentation]    Uploading a non-image file is rejected without replacing the preview.
    ${path}=    Join Path    ${TEMPDIR}    robot-not-an-image.exe
    Create Binary File    ${path}    not an image
    Reveal Profile Image Input
    Choose File    ${FILE_INPUT}    ${path}
    Wait Until Element Is Visible    ${ALERT_TITLE}
    Element Text Should Be    ${ALERT_TITLE}    ประเภทไฟล์ไม่ถูกต้อง
    Preview Should Not Be Data URL
    Remove File    ${path}

TC_9_0_006 Reject Image Larger Than 10 MB
    [Documentation]    Oversized images show the 10 MB validation message used by the profile component.
    ${content}=    Evaluate    bytes(10 * 1024 * 1024 + 1)
    ${path}=    Join Path    ${TEMPDIR}    robot-oversized.jpg
    Create Binary File    ${path}    ${content}
    Reveal Profile Image Input
    Choose File    ${FILE_INPUT}    ${path}
    Wait Until Element Is Visible    ${ALERT_TITLE}
    Element Text Should Be    ${ALERT_TITLE}    ไฟล์ใหญ่เกินไป!
    Element Text Should Be    ${ALERT_TEXT}    กรุณาเลือกไฟล์ที่ไม่เกิน 10MB
    Preview Should Not Be Data URL
    Remove File    ${path}

US_09_AC_5 Trim Whitespace Before Saving
    [Documentation]    Leading and trailing whitespace is removed from submitted names.
    ${first_name}=    Set Variable    ${SPACE}${SPACE}Chitipat${SPACE}${SPACE}
    ${last_name}=    Set Variable    ${SPACE}${SPACE}Churhor${SPACE}${SPACE}
    Input Text    ${FIRST_NAME_INPUT}    ${first_name}
    Input Text    ${LAST_NAME_INPUT}    ${last_name}
    Click Element    ${SAVE_BUTTON}
    Wait Until Element Is Visible    ${ALERT_TITLE}
    Element Text Should Be    ${ALERT_TITLE}    อัปเดตข้อมูลเรียบร้อย!
    ${submitted}=    Execute JavaScript    return window.__us09Requests[0].submittedValues;
    Should Be Equal    ${submitted}[firstName]    Chitipat
    Should Be Equal    ${submitted}[lastName]    Churhor

US_09_AC_6 Email Is Read Only
    [Documentation]    The account email is displayed but cannot be edited from the profile form.
    ${read_only}=    Get Element Attribute    ${EMAIL_INPUT}    readonly
    Should Not Be Empty    ${read_only}

US_09_AC_7 Handle Server Failure
    [Documentation]    A failed save shows an error and preserves the original local user.
    Execute JavaScript    window.__us09ResponseStatus = 500;
    Input Text    ${FIRST_NAME_INPUT}    Unsaved change
    Click Element    ${SAVE_BUTTON}
    Wait Until Element Is Visible    ${ALERT_TITLE}
    Element Text Should Be    ${ALERT_TITLE}    ผิดพลาด
    Element Text Should Be    ${ALERT_TEXT}    เกิดข้อผิดพลาดในระบบ
    ${stored_first_name}=    Execute JavaScript    return JSON.parse(localStorage.getItem("user")).firstName;
    Should Be Equal    ${stored_first_name}    ${ORIGINAL_FIRST_NAME}


*** Keywords ***
Open Profile
    Go To    ${BASE_URL}/profile
    Wait Until Element Is Visible    ${FIRST_NAME_INPUT}
    Wait Until Element Is Visible    ${SAVE_BUTTON}

Create Test Browser
    ${options}=    Evaluate    __import__('selenium.webdriver', fromlist=['ChromeOptions']).ChromeOptions()
    Evaluate    $options.add_argument('--headless=new')
    Evaluate    $options.add_argument('--window-size=1920,1080')
    Open Browser    about:blank    chrome    options=${options}
    ${selenium_library}=    Get Library Instance    SeleniumLibrary
    ${driver}=    Evaluate    $selenium_library.driver
    ${mock_script}=    Get File    ${CURDIR}${/}resources${/}profile_api_mock.js
    ${script_arguments}=    Create Dictionary    source=${mock_script}
    Call Method    ${driver}    execute_cdp_cmd    Page.addScriptToEvaluateOnNewDocument    ${script_arguments}

Reveal Profile Image Input
    Execute JavaScript
    ...    const input = document.querySelector('input[type="file"]'); input.classList.remove("hidden"); input.style.display = "block";

Preview Should Be Data URL
    ${source}=    Execute JavaScript
    ...    return document.querySelectorAll('img[alt="Profile"]')[document.querySelectorAll('img[alt="Profile"]').length - 1].getAttribute("src") || "";
    Should Start With    ${source}    data:image/png

Preview Should Not Be Data URL
    ${source}=    Execute JavaScript
    ...    return document.querySelectorAll('img[alt="Profile"]')[document.querySelectorAll('img[alt="Profile"]').length - 1].getAttribute("src") || "";
    Should Not Start With    ${source}    data:
