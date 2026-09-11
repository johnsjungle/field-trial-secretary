import unittest
from unittest.mock import patch
import server
import pypdfium2 as pdfium
class AkcFlightMarks(unittest.TestCase):
 def test_marks_match_template_letters(self):
  doc=pdfium.PdfDocument(str(server.JUDGE_TEMPLATES['AKC']));page=doc[0];textpage=page.get_textpage();text=textpage.get_text_range();start=text.index('Stake:');end=text.index('Course:',start)
  for letter in 'ABCDE':
   index=text.index(letter,start,end);left,bottom,right,top=textpage.get_charbox(index)
   with patch.object(server,'draw_circle') as draw:
    server.draw_akc_split_stake_mark(None,letter)
    args=draw.call_args.args
    self.assertLess(abs(args[1]-(left+right)/2),0.15)
    self.assertLess(abs(args[2]-(bottom+top)/2),0.15)
 def test_unknown_flight_is_not_marked(self):
  with patch.object(server,'draw_circle') as draw:
   server.draw_akc_split_stake_mark(None,'')
   draw.assert_not_called()
if __name__=='__main__':unittest.main()
