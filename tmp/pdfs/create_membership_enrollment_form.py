from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.acroform import AcroForm
from reportlab.pdfgen import canvas


ROOT = Path("/Users/franz.tanglao/GitHub/stgenknights")
OUTPUT = ROOT / "output/pdf/knights-of-columbus-membership-enrollment-form.pdf"
LOGO = ROOT / "img/knights-of-columbus-logo.png"

PAGE_W, PAGE_H = landscape(letter)
NAVY = HexColor("#06295c")
GOLD = HexColor("#c9a43b")
INK = HexColor("#111827")
MUTED = HexColor("#4b5563")
FIELD_BG = HexColor("#fbfcff")
LINE = HexColor("#8a96a8")


def label(c, text, x, y, size=9, bold=True, color=INK):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, y, text)


def text_field(form: AcroForm, name, x, y, w, h=20, font_size=10):
    form.textfield(
        name=name,
        tooltip=name.replace("_", " ").title(),
        x=x,
        y=y,
        width=w,
        height=h,
        borderWidth=1,
        borderColor=LINE,
        fillColor=FIELD_BG,
        textColor=INK,
        forceBorder=True,
        fontName="Helvetica",
        fontSize=font_size,
    )


def checkbox(form: AcroForm, name, x, y, size=13):
    form.checkbox(
        name=name,
        tooltip=name.replace("_", " ").title(),
        x=x,
        y=y,
        size=size,
        buttonStyle="check",
        borderWidth=1,
        borderColor=NAVY,
        fillColor=white,
        textColor=NAVY,
        forceBorder=True,
    )


def wrapped_text(c, text, x, y, max_width, font="Helvetica", size=8, leading=10):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if c.stringWidth(trial, font, size) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    c.setFont(font, size)
    c.setFillColor(MUTED)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H))
    c.setTitle("Knights of Columbus Membership Enrollment Form")
    c.setAuthor("Knights of Columbus")
    form = c.acroForm

    margin = 34
    content_w = PAGE_W - 2 * margin

    # Full-page frame and header.
    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.roundRect(18, 18, PAGE_W - 36, PAGE_H - 36, 8, stroke=1, fill=0)
    c.setFillColor(NAVY)
    c.roundRect(margin, PAGE_H - 103, content_w, 67, 6, stroke=0, fill=1)
    c.drawImage(ImageReader(str(LOGO)), margin + 15, PAGE_H - 95, 50, 50, preserveAspectRatio=True, mask="auto")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(margin + 78, PAGE_H - 76, "Membership Enrollment Form")
    c.setFont("Helvetica", 9)
    c.drawRightString(PAGE_W - margin - 15, PAGE_H - 75, "Knights of Columbus")

    # Eligibility statement.
    checkbox(form, "eligibility_confirmed", margin + 3, PAGE_H - 135, 14)
    label(c, "Yes!", margin + 23, PAGE_H - 130, 10, True, NAVY)
    eligibility = (
        "I am a baptized Catholic man over the age of 18 and a practicing Catholic. "
        "Please sign me up for e-membership in the Knights of Columbus at no cost "
        "for the first year (a $30 value)!"
    )
    wrapped_text(c, eligibility, margin + 53, PAGE_H - 126, content_w - 58, size=9, leading=11)

    # Applicant information section.
    section_y = PAGE_H - 166
    c.setFillColor(HexColor("#eef3fa"))
    c.roundRect(margin, section_y - 16, content_w, 21, 4, stroke=0, fill=1)
    label(c, "APPLICANT INFORMATION", margin + 10, section_y - 10, 10, True, NAVY)

    left = margin
    mid = 402
    field_h = 19
    row1 = section_y - 51
    label(c, "First Name", left, row1 + 5)
    text_field(form, "first_name", left + 66, row1, 244, field_h)
    label(c, "Last Name", mid, row1 + 5)
    text_field(form, "last_name", mid + 65, row1, PAGE_W - margin - (mid + 65), field_h)

    row2 = row1 - 33
    label(c, "Email", left, row2 + 5)
    text_field(form, "email", left + 66, row2, 300, field_h)
    label(c, "Cell Phone", mid, row2 + 5)
    text_field(form, "cell_phone", mid + 65, row2, PAGE_W - margin - (mid + 65), field_h)

    row3 = row2 - 33
    label(c, "Street Address", left, row3 + 5)
    text_field(form, "street_address", left + 78, row3, content_w - 78, field_h)

    row4 = row3 - 33
    label(c, "City", left, row4 + 5)
    text_field(form, "city", left + 40, row4, 260, field_h)
    label(c, "State/Prov.", 350, row4 + 5)
    text_field(form, "state_province", 420, row4, 100, field_h)
    label(c, "Zip/Postal Code", 540, row4 + 5)
    text_field(form, "postal_code", 635, row4, PAGE_W - margin - 635, field_h)

    row5 = row4 - 33
    label(c, "Parish", left, row5 + 5)
    text_field(form, "parish", left + 45, row5, 300, field_h)
    label(c, "Parish City, State", mid, row5 + 5)
    text_field(form, "parish_city_state", mid + 105, row5, PAGE_W - margin - (mid + 105), field_h)

    row6 = row5 - 33
    label(c, "Date of Birth", left, row6 + 5)
    text_field(form, "date_of_birth", left + 75, row6, 128, field_h)
    label(c, "MM / DD / YYYY", left + 208, row6 + 5, 7, False, MUTED)
    label(c, "Former Member?", 350, row6 + 5)
    checkbox(form, "former_member_yes", 438, row6 + 2, 13)
    label(c, "Yes", 455, row6 + 5, 9, False)
    checkbox(form, "former_member_no", 493, row6 + 2, 13)
    label(c, "No", 510, row6 + 5, 9, False)

    row7 = row6 - 34
    label(c, "Preferred Language", left, row7 + 5)
    choices = [("English", "language_english"), ("Francais", "language_francais"), ("Espanol", "language_espanol")]
    x = left + 108
    for choice, name in choices:
        checkbox(form, name, x, row7 + 2, 13)
        label(c, choice, x + 17, row7 + 5, 9, False)
        x += 88
    checkbox(form, "language_other", x, row7 + 2, 13)
    label(c, "Other", x + 17, row7 + 5, 9, False)
    text_field(form, "language_other_detail", x + 53, row7, PAGE_W - margin - (x + 53), field_h)

    row8 = row7 - 34
    label(c, "Member Referral Number", left, row8 + 5)
    text_field(form, "member_referral_number", left + 137, row8, 250, field_h)

    # Attestation and signature.
    attest_y = row8 - 33
    c.setFillColor(HexColor("#eef3fa"))
    c.roundRect(margin, attest_y - 12, content_w, 22, 4, stroke=0, fill=1)
    label(c, "ATTESTATION", margin + 10, attest_y - 6, 10, True, NAVY)
    label(c, "By signing below, I attest to the accuracy of all the information provided above.", margin, attest_y - 32, 9, False)

    sig_y = attest_y - 63
    label(c, "Signature", left, sig_y + 5)
    text_field(form, "signature", left + 58, sig_y, 455, 21, 10)
    label(c, "Date", 565, sig_y + 5)
    text_field(form, "signature_date", 600, sig_y, PAGE_W - margin - 600, 21, 10)

    # Registration notice.
    notice = (
        "To complete your registration as an e-member, we will input the information you provided above into our online membership system. "
        "Once that is complete, you will need to confirm your membership by responding to an email from the Knights of Columbus at the email address listed above. "
        "If you do not respond to the registration email, a Knights of Columbus representative may reach out to help you complete the registration process."
    )
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(margin, 51, PAGE_W - margin, 51)
    label(c, "REGISTRATION NOTICE", margin, 40, 7, True, NAVY)
    wrapped_text(c, notice, margin, 29, content_w, size=6.4, leading=7)

    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
