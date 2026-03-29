/**
 * Human-readable animation titles keyed by animIndex (world-encoded).
 * ACT1: animIndex 0-368, ACT2: 16384+, ACT3: 32768+
 */
export const AnimationTitles = Object.freeze({
    // ── ACT1 ──
    0: "Bank Closed for Remodeling", // objectId=500
    1: "Counting Visitors", // objectId=501
    2: "Laughing All the Way to the Bank", // objectId=502
    3: "Lockstep Parade", // objectId=503
    4: "Walking in Line", // objectId=504
    5: "The Light's About to Change", // objectId=505
    6: "Leapfrog", // objectId=506
    7: "Piggyback Leapfrog", // objectId=507
    8: "Welcome to Nubby's", // objectId=508
    9: "Red Car vs. Blue Car", // objectId=509
    10: "Build a Dune Buggy", // objectId=510
    11: "Why Don't We Have Elbows?", // objectId=511
    12: "Why Don't More of Us Ride Bicycles?", // objectId=512
    13: "Snappy Automobile", // objectId=513
    14: "Beautiful Day", // objectId=514
    15: "Lost My Memory", // objectId=515
    16: "You First! No You First!", // objectId=516
    17: "No Clapping in the Hospital", // objectId=517
    18: "A Leg Up or a Foot Down", // objectId=518
    19: "Your Head's a Little Loose", // objectId=519
    20: "Late for Plastic Surgery", // objectId=520
    21: "I Can't Place the Name", // objectId=521
    22: "Pizza Ambulance", // objectId=522
    23: "Disassembly Required", // objectId=523
    24: "Car Compressor", // objectId=524
    25: "Can't Spell Pepper", // objectId=525
    26: "Build Schools, Not Prisons", // objectId=526
    27: "The Condiment Family", // objectId=527
    28: "Laura Can't Add", // objectId=528
    29: "Nothing Adds Up", // objectId=529
    30: "What Comes After Two?", // objectId=530
    31: "Chip Off the Old Block", // objectId=531
    32: "The Man With No Nose", // objectId=532
    33: "I'm Innocent!", // objectId=533
    34: "Papa's Shoes Are Untied", // objectId=534
    35: "Now That's Art", // objectId=535
    36: "Good Dancers", // objectId=536
    37: "How Many Claws?", // objectId=537
    38: "Play Me a Jailbreak Tune", // objectId=538
    39: "It's Me, the Tree", // objectId=539
    40: "Let Me Out", // objectId=540
    41: "Breaking and Entering", // objectId=541
    42: "I Demand a Mistrial", // objectId=542
    43: "Build a Jet Ski", // objectId=543
    44: "Throw Me to the Refreshment Stand", // objectId=544
    45: "It's Hot", // objectId=545
    46: "Perfect for Motos", // objectId=546
    47: "Even the Sharks Come Here", // objectId=547
    48: "Last One In Is a Dirty Brick", // objectId=548
    49: "Stoked and Ready to Smoke", // objectId=549
    50: "That Was Fast", // objectId=550
    51: "Shark Attack on Jetski", // objectId=551
    52: "Pull Up to the Buoy", // objectId=552
    53: "Twisted Course on the North Side", // objectId=553
    54: "Shark Spotting a Dog", // objectId=554
    55: "Keep the Buoys to Your Right", // objectId=555
    56: "Heads Up, Glue Your Bow", // objectId=556
    57: "Reminds Me of Me", // objectId=557
    58: "Falling Apart on the Hill", // objectId=558
    59: "The Pyramid Stunt", // objectId=559
    60: "Hi There!", // objectId=560
    61: "My Bricks Are Killing Me", // objectId=561
    62: "Lockstep Moonwalk", // objectId=562
    63: "Build a Helicopter!", // objectId=563
    64: "All's Quiet on This Side", // objectId=564
    65: "Not Very Quiet at All", // objectId=565
    66: "Move It, Booking", // objectId=566
    67: "Best Pizza on the Island", // objectId=567
    68: "Mozart of Meatballs", // objectId=568
    69: "Faster Than a Loose Brick on Ice", // objectId=569
    70: "Where Is My Piano?", // objectId=570
    71: "Learn to Read, Not Skateboard", // objectId=571
    72: "Too Cool for Words", // objectId=572
    73: "Unusual Bricks Out There", // objectId=573
    74: "P-I-Z-Z-A", // objectId=574
    75: "Watch Me Dance", // objectId=575
    76: "Sir Circumference", // objectId=576
    77: "You Look Thin, Officer Nick", // objectId=577
    78: "I'll Smell for You", // objectId=578
    79: "Looking Snappy", // objectId=579
    80: "Let's Dance, Officer Nick", // objectId=580
    81: "I Remember the White Apron", // objectId=581
    82: "Picasso of Pizza", // objectId=582
    83: "Music Makes the Flowers Sing", // objectId=583
    84: "Tickle the Ivories", // objectId=584
    85: "Songs Fill My Bricks With Joy", // objectId=585
    86: "That's My Pepper", // objectId=586
    87: "Your Smile Reminds Me of a Song", // objectId=587
    88: "You Look So Lovely I Could Dance", // objectId=588
    89: "Good Friend Song", // objectId=589
    90: "We Adore a Lola", // objectId=590
    91: "Come Dance With Me", // objectId=591
    92: "That Pizza Smells So Good", // objectId=592
    93: "Concert of a Kitchen", // objectId=593
    94: "Pizza Symphony", // objectId=594
    95: "Dance With the Pizza", // objectId=595
    96: "You're Seeing Someone Else", // objectId=596
    97: "Biggest Slice, No Elbows", // objectId=597
    98: "Sauce on the Dough", // objectId=598
    99: "Pizza Masterpiece", // objectId=599
    100: "Pizza Surfing", // objectId=600
    101: "Mug Stacking", // objectId=601
    102: "Big Dog Wants Pizza", // objectId=602
    103: "Click on the Pizzeria", // objectId=603
    104: "Gorilla Flip", // objectId=604
    105: "Bad Smeller", // objectId=605
    106: "Airborne!", // objectId=606
    107: "Mama Wrote Me a Theme Song", // objectId=607
    108: "Pizza Delivery Dude", // objectId=608
    109: "Pizza Delivery!", // objectId=609
    110: "Something's Not Put Together Right", // objectId=610
    111: "Use Your Brain", // objectId=611
    112: "Build a Race Car", // objectId=612
    113: "Race to the Pit Stop", // objectId=613
    114: "You're Lost", // objectId=614
    115: "Ask for Directions", // objectId=615
    116: "Going in Circles", // objectId=616
    117: "50 Is Legal", // objectId=617
    118: "I Grind That Fast", // objectId=618
    119: "Go! Go! Go!", // objectId=619
    120: "Goal! Whoa! Wow!", // objectId=620
    121: "Store Closed for Remodeling", // objectId=621
    122: "Shark Warning", // objectId=622
    123: "Things Can Change", // objectId=623
    124: "Don't Cut Corners", // objectId=624
    125: "I Remember Everything", // objectId=625
    126: "Go Low and Slow", // objectId=626
    127: "You Can Count on Me", // objectId=627
    128: "Very Police-Like", // objectId=628
    129: "Lost Count on Patrol", // objectId=629
    130: "Parrot Stuck in a Car Again", // objectId=630
    131: "Register Those Songs", // objectId=631
    132: "Drive as Well as You Play Piano", // objectId=632
    133: "An Anthem for Lego Island", // objectId=633
    134: "I Ought to Get Me One of Those", // objectId=634
    135: "Humming Your Tune", // objectId=635
    136: "Faster Than a Car", // objectId=636
    137: "Make the Birds and Trees Sing", // objectId=637
    138: "I Can Count on You", // objectId=638
    139: "504 Pizzas a Week", // objectId=639
    140: "Are You Going to Sing?", // objectId=640
    141: "If I Wasn't on Duty", // objectId=641
    142: "They Look Like They Smell Delicious", // objectId=642
    143: "Papa, You're the Greatest", // objectId=643
    144: "Twisted a Brick Dancing", // objectId=644
    145: "Slow Down Your Dance Steps", // objectId=645
    146: "You Move Way Too Fast", // objectId=646
    147: "Snapping Pepper Together", // objectId=647
    148: "Lucky to Have You, Sis", // objectId=648
    149: "Cessquapavillion", // objectId=649
    150: "Sir Comference, Knight", // objectId=650
    151: "Papa Can't Sing", // objectId=651
    152: "Consider This a Warning", // objectId=652
    153: "Crime Doesn't Pay", // objectId=653
    154: "Don't Block the Road", // objectId=654
    155: "Just a Matter of Time", // objectId=655
    156: "Don't Run Into Anybody", // objectId=656
    157: "Try the Helicopter", // objectId=657
    158: "One Pretty Island", // objectId=658
    159: "Head Spinning", // objectId=659
    160: "You Must Have My Mail", // objectId=660
    161: "My Parrot Got Loose", // objectId=661
    162: "Rain, Snow, Sleet, and Hail", // objectId=662
    163: "Rad Race Car With a Skull Decal", // objectId=663
    164: "Lovely Day for a Bike Ride", // objectId=664
    165: "Perfect Day for Gardening", // objectId=665
    166: "Cool Hat", // objectId=666
    167: "Check Out the Tunes", // objectId=667
    168: "Protect and Serve", // objectId=668
    169: "You Look Lost", // objectId=669
    170: "Eyes Straight Ahead", // objectId=670
    171: "Brickster's Locked Behind Closed Doors", // objectId=671
    172: "A Lovely Day to You", // objectId=672
    173: "Save It for the Racetrack", // objectId=673
    174: "A Gracious Howdy Do", // objectId=674
    175: "Ed Mail Drops His Mail", // objectId=675
    176: "My Goodness Gracious!", // objectId=676
    177: "Hey, What's Up!", // objectId=677
    178: "Laura's Motorcycle Tumble", // objectId=678
    179: "Nick's Motorcycle Tumble", // objectId=679
    180: "Race Begins at the Buoy", // objectId=680
    181: "Ain't She a Beaut!", // objectId=681
    182: "Let's See What It Can Do", // objectId=682
    183: "The Helicopter Maniac", // objectId=683
    184: "A Regular Studs Lincoln", // objectId=684
    185: "You Show Real Potential", // objectId=685
    186: "Thanks for Your Help", // objectId=686
    187: "What Do We Do If It's Hot?", // objectId=687
    188: "Parrot Dive-Bombing", // objectId=688
    189: "Look Out!", // objectId=689
    190: "I'm Already Here!", // objectId=690
    191: "Look Before You Leap!", // objectId=691
    192: "Stand Up, Sit Down, Fight!", // objectId=692
    193: "Where have you been?", // objectId=693
    194: "Some dude is choking in there", // objectId=694
    195: "You'd better get in there.", // objectId=695
    196: "Quick do something.", // objectId=696
    197: "Won't Somebody Help That Poor Man?", // objectId=697
    198: "I kept telling him chew!", // objectId=698
    199: "That's not on the menu.", // objectId=699
    200: "Oh won't somebody help that poor shark!", // objectId=700
    201: "Er er er er er.", // objectId=701
    202: "Ah ah ah ah ah.", // objectId=702
    203: "Oh ha horror.", // objectId=703
    204: "Go key. Oh oh.", // objectId=704
    205: "Choking #1", // objectId=705
    206: "Choking #2", // objectId=706
    207: "Choking #3", // objectId=707
    208: "Choking #4", // objectId=708
    209: "Paperplane Launch #1", // objectId=709
    210: "Paperplane Launch #2", // objectId=710
    211: "Paperplane Launch #3", // objectId=711
    212: "Pizza So Hot", // objectId=712
    213: "Still Warm", // objectId=713
    214: "Cold Pizza", // objectId=714
    215: "360 Pieces of Pepperoni", // objectId=715
    216: "Must Be Pizza Day", // objectId=716
    217: "Fat as a Brick House", // objectId=717
    218: "Skateboard Tips (Papa)", // objectId=718
    219: "Go Vert! (Papa)", // objectId=719
    220: "You Go, We'll Think of Something", // objectId=720
    221: "Extreme Skateboard Experience (Pepper)", // objectId=721
    222: "Don't Be Afraid to Go Vert (Pepper)", // objectId=722
    223: "You're Looking Fat, Mama", // objectId=723
    224: "Nix Polizoria #1", // objectId=724
    225: "Nix Polizoria #2", // objectId=725
    226: "Nix Polizoria #3", // objectId=726
    227: "Deliver Pizza to Nubby", // objectId=727
    228: "Another One for Nubby", // objectId=728
    229: "Calling Him Stubby", // objectId=729
    230: "Take Pepper's Skateboard", // objectId=730
    231: "Pepper Should Be Back Soon", // objectId=731
    232: "Rush Order for Studs Lincoln", // objectId=732
    233: "Sad Pizza Song", // objectId=733
    234: "Another One for the Track", // objectId=734
    235: "Skateboarding Is Like Dancing", // objectId=735
    236: "Pizza's Still on the Ceiling", // objectId=736
    237: "Maybe Pepper Will Come Back", // objectId=737
    238: "Just Don't Fall!", // objectId=738
    239: "Lucky Pizza", // objectId=739
    240: "Reheat It on the Engine", // objectId=740
    241: "Cold Pizza in Reverse", // objectId=741
    242: "The pizzas nice and hot.", // objectId=742
    243: "Pizza's Still Warm, Quick Operating!", // objectId=743
    244: "Pizza's DOA!", // objectId=744
    245: "Laura, Deliver to the Hospital", // objectId=745
    246: "Hospital Needs Another Pizza", // objectId=746
    247: "One More Pizza to Go", // objectId=747
    248: "Grind It or Smith It? (Mama)", // objectId=748
    249: "Twice as Much Topping", // objectId=749
    250: "Figuring Something Out", // objectId=750
    251: "Grind It or Smith It? (Pepper)", // objectId=751
    252: "A True Betty Now", // objectId=752
    253: "Rip It Up!", // objectId=753
    254: "Cat Chases Parrot (Unfinished)", // objectId=754
    255: "Bring the Pizza Over Here", // objectId=755
    256: "Helicopters Are Fun", // objectId=756
    257: "Pepperoni Again?!", // objectId=757
    258: "Build That Helicopter", // objectId=758
    259: "Wrong Pizza", // objectId=759
    260: "Papa's Famous Garlic Pizza", // objectId=760
    261: "Send Pizza to the Jail (Mama)", // objectId=761
    262: "Send Pizza to the Jail (Papa)", // objectId=762
    263: "Papa Wants the Mud Stacked", // objectId=763
    264: "Party at the County Jail", // objectId=764
    265: "Papa's Got the Sixth Sense", // objectId=765
    266: "Something About That Call", // objectId=766
    267: "Back Already?", // objectId=767
    268: "First Tow's on Me", // objectId=768
    269: "Oil in Your Blood, Mama", // objectId=769
    270: "Good Reflexes, Nick", // objectId=770
    271: "Let Me Throw Pizzas", // objectId=771
    272: "You're the Best, Laura!", // objectId=772
    273: "Heard You Had Trouble", // objectId=773
    274: "By the Time You Can Drive", // objectId=774
    275: "Practice Makes Perfect", // objectId=775
    276: "Not a High-Speed Chase Vehicle", // objectId=776
    277: "I'm Not Blaming You, Papa", // objectId=777
    278: "Come Back and Do Better", // objectId=778
    279: "Thanks for Helping!", // objectId=779
    280: "That Took a Long Time!", // objectId=780
    281: "Smashing So Much Stuff", // objectId=781
    282: "Nancy Prefers I Don't Sing", // objectId=782
    283: "Good Thing You Don't Catch Crooks That Way", // objectId=783
    284: "He Who Does Something", // objectId=784
    285: "A Little More Practice, Laura", // objectId=785
    286: "Try Again Sometime!", // objectId=786
    287: "Tow Truck Recovery", // objectId=787
    288: "I've Got to Finish the Race!", // objectId=788
    289: "Red Car Is Blocking the Track!", // objectId=789
    290: "Didn't You See the Red Car?", // objectId=790
    291: "Nothing to See Here", // objectId=791
    292: "I Said We'd Be Back!", // objectId=792
    293: "Dance #1", // objectId=793
    294: "Dance #2", // objectId=794
    295: "Dance #3", // objectId=795
    296: "Dance #4", // objectId=796
    297: "Dance #5", // objectId=797
    298: "Dance #6", // objectId=798
    299: "Dance #7", // objectId=799
    356: "I Love Jet Skis!", // objectId=856
    357: "Move Your Hand Off the Wheel", // objectId=857
    358: "I Love Two Wheelers!", // objectId=858
    359: "Have a Gas on That Skateboard!", // objectId=859
    360: "Jet Ski First Place!", // objectId=860
    361: "Jet Ski Second Place!", // objectId=861
    362: "Jet Ski Third Place", // objectId=862
    363: "Jet Ski Better Luck Next Time", // objectId=863
    364: "Race First Place!", // objectId=864
    365: "Race Second Place!", // objectId=865
    366: "Race Third Place!", // objectId=866
    367: "Race Better Luck Next Time", // objectId=867
    368: "Start Your Engines!", // objectId=868
    // ── ACT2 ──
    16384: "Can\'t Keep Count", // objectId=500
    16385: "The Brickster Must Be Stopped", // objectId=501
    16386: "My Beautiful Garage Is Sinking", // objectId=502
    16387: "I Think Too Much", // objectId=503
    16388: "Keep It Together", // objectId=504
    16389: "He\'s Kind of Cute", // objectId=505
    16390: "Pizza Escape", // objectId=506
    16391: "Self-Pardon", // objectId=507
    16392: "I\'m Free!", // objectId=508
    16393: "Biggest Mistake of Your Life", // objectId=509
    16394: "The Brickster Has Escaped", // objectId=510
    16395: "Lord of the Bricks", // objectId=511
    16396: "The Brickster Rules", // objectId=512
    16397: "Tee Brick Sir", // objectId=513
    16398: "Our Town Is Disappearing", // objectId=514
    16399: "Usually I\'m Yellow", // objectId=515
    16400: "Save Our Island", // objectId=516
    16401: "Reminds Me of Me", // objectId=517
    16402: "Power\'s Out", // objectId=518
    16403: "We\'re Counting on You", // objectId=519
    16404: "It Was a Lot Cooler", // objectId=520
    16405: "Losing Power", // objectId=521
    16406: "Suspicious Character Spotted", // objectId=522
    16407: "I Remember His Every Move", // objectId=523
    16408: "Brickster\'s Laugh", // objectId=524
    16409: "All I Can Say Is", // objectId=525
    16410: "The Mambo Shuffle", // objectId=526
    16411: "The Cave Blockade", // objectId=527
    16412: "Clearing the Blockades", // objectId=528
    16413: "Track Is Down", // objectId=529
    16414: "More Fun Before This Mess", // objectId=530
    16415: "How Can I Win?", // objectId=531
    16416: "De-Bricking Blast", // objectId=532
    16417: "Twenty Bricks to the South", // objectId=533
    16418: "Polar Bear or Brickster?", // objectId=534
    16419: "Country Western Reggae Ditty", // objectId=535
    16420: "Snap to It", // objectId=536
    16421: "Good Luck Friend", // objectId=537
    16422: "The Scent of Jasmine", // objectId=538
    16423: "Do Not Panic!", // objectId=539
    16424: "Don\'t Want to Remember This", // objectId=540
    16425: "Two Hats or Three?", // objectId=541
    16426: "The Town Needs Your Help", // objectId=542
    16427: "Keep a Stiff Upper Brick", // objectId=543
    16428: "Good Catch!", // objectId=544
    16429: "Deliver This!", // objectId=545
    16430: "Mean Pizza Machine", // objectId=546
    16431: "He Shoots He Scores!", // objectId=547
    16432: "Can\'t Catch Me", // objectId=548
    16433: "Pepper in the Air", // objectId=549
    16434: "Maniacal Laughter", // objectId=550
    16435: "Big Deal!", // objectId=551
    16436: "I Got a Bunch More", // objectId=552
    16437: "Useless One", // objectId=553
    16438: "One Less Brick", // objectId=554
    16439: "I\'ll Hide the Rest", // objectId=555
    16440: "I\'ll Put His Head on Backwards", // objectId=556
    16441: "Situation Red", // objectId=557
    16442: "Close Your Doors", // objectId=558
    16443: "Technical Difficulties", // objectId=559
    16444: "Simply Dreadful!", // objectId=560
    16445: "Cancel All Appointments", // objectId=561
    16446: "Prescription for Capture", // objectId=562
    16447: "No Mail for the Brickster", // objectId=563
    16448: "Every Flower Disappears", // objectId=564
    16449: "Get It Together!", // objectId=565
    16450: "Have You Seen My Parrot?", // objectId=566
    16451: "Just Not Right", // objectId=567
    16452: "Shine Is Off the Brick", // objectId=568
    16453: "Go Get Him Pepper!", // objectId=569
    16454: "He Went That Away!", // objectId=570
    16455: "The Good Guys\' Side", // objectId=571
    16456: "Hikes!", // objectId=572
    16457: "Everything\'s Sinking!", // objectId=573
    16458: "Help!", // objectId=574
    16459: "Run! Hide!", // objectId=575
    16460: "Brick Found", // objectId=576
    16461: "Build the Helicopter", // objectId=577
    16462: "Helicopter Pieces Found", // objectId=578
    16463: "Brickster\'s Loose! (BD)", // objectId=579
    16464: "Brickster\'s Loose! (PG)", // objectId=580
    16465: "Brickster\'s Loose! (RD)", // objectId=581
    16466: "Brickster\'s Loose! (SY)", // objectId=582
    // ── ACT3 ──
    32768: "The Pizza Turbo Chucker Plan", // objectId=500
    32769: "Good Luck Partner", // objectId=501
    32770: "Shoot Pizzas at the Brickster", // objectId=502
});

/**
 * Maps animIndex to the SI file object ID.
 * Needed for SI file references and future use.
 */
export const AnimationObjectIds = Object.freeze({
    // ── ACT1 ──
    0: 500,
    1: 501,
    2: 502,
    3: 503,
    4: 504,
    5: 505,
    6: 506,
    7: 507,
    8: 508,
    9: 509,
    10: 510,
    11: 511,
    12: 512,
    13: 513,
    14: 514,
    15: 515,
    16: 516,
    17: 517,
    18: 518,
    19: 519,
    20: 520,
    21: 521,
    22: 522,
    23: 523,
    24: 524,
    25: 525,
    26: 526,
    27: 527,
    28: 528,
    29: 529,
    30: 530,
    31: 531,
    32: 532,
    33: 533,
    34: 534,
    35: 535,
    36: 536,
    37: 537,
    38: 538,
    39: 539,
    40: 540,
    41: 541,
    42: 542,
    43: 543,
    44: 544,
    45: 545,
    46: 546,
    47: 547,
    48: 548,
    49: 549,
    50: 550,
    51: 551,
    52: 552,
    53: 553,
    54: 554,
    55: 555,
    56: 556,
    57: 557,
    58: 558,
    59: 559,
    60: 560,
    61: 561,
    62: 562,
    63: 563,
    64: 564,
    65: 565,
    66: 566,
    67: 567,
    68: 568,
    69: 569,
    70: 570,
    71: 571,
    72: 572,
    73: 573,
    74: 574,
    75: 575,
    76: 576,
    77: 577,
    78: 578,
    79: 579,
    80: 580,
    81: 581,
    82: 582,
    83: 583,
    84: 584,
    85: 585,
    86: 586,
    87: 587,
    88: 588,
    89: 589,
    90: 590,
    91: 591,
    92: 592,
    93: 593,
    94: 594,
    95: 595,
    96: 596,
    97: 597,
    98: 598,
    99: 599,
    100: 600,
    101: 601,
    102: 602,
    103: 603,
    104: 604,
    105: 605,
    106: 606,
    107: 607,
    108: 608,
    109: 609,
    110: 610,
    111: 611,
    112: 612,
    113: 613,
    114: 614,
    115: 615,
    116: 616,
    117: 617,
    118: 618,
    119: 619,
    120: 620,
    121: 621,
    122: 622,
    123: 623,
    124: 624,
    125: 625,
    126: 626,
    127: 627,
    128: 628,
    129: 629,
    130: 630,
    131: 631,
    132: 632,
    133: 633,
    134: 634,
    135: 635,
    136: 636,
    137: 637,
    138: 638,
    139: 639,
    140: 640,
    141: 641,
    142: 642,
    143: 643,
    144: 644,
    145: 645,
    146: 646,
    147: 647,
    148: 648,
    149: 649,
    150: 650,
    151: 651,
    152: 652,
    153: 653,
    154: 654,
    155: 655,
    156: 656,
    157: 657,
    158: 658,
    159: 659,
    160: 660,
    161: 661,
    162: 662,
    163: 663,
    164: 664,
    165: 665,
    166: 666,
    167: 667,
    168: 668,
    169: 669,
    170: 670,
    171: 671,
    172: 672,
    173: 673,
    174: 674,
    175: 675,
    176: 676,
    177: 677,
    178: 678,
    179: 679,
    180: 680,
    181: 681,
    182: 682,
    183: 683,
    184: 684,
    185: 685,
    186: 686,
    187: 687,
    188: 688,
    189: 689,
    190: 690,
    191: 691,
    192: 692,
    193: 693,
    194: 694,
    195: 695,
    196: 696,
    197: 697,
    198: 698,
    199: 699,
    200: 700,
    201: 701,
    202: 702,
    203: 703,
    204: 704,
    205: 705,
    206: 706,
    207: 707,
    208: 708,
    209: 709,
    210: 710,
    211: 711,
    212: 712,
    213: 713,
    214: 714,
    215: 715,
    216: 716,
    217: 717,
    218: 718,
    219: 719,
    220: 720,
    221: 721,
    222: 722,
    223: 723,
    224: 724,
    225: 725,
    226: 726,
    227: 727,
    228: 728,
    229: 729,
    230: 730,
    231: 731,
    232: 732,
    233: 733,
    234: 734,
    235: 735,
    236: 736,
    237: 737,
    238: 738,
    239: 739,
    240: 740,
    241: 741,
    242: 742,
    243: 743,
    244: 744,
    245: 745,
    246: 746,
    247: 747,
    248: 748,
    249: 749,
    250: 750,
    251: 751,
    252: 752,
    253: 753,
    254: 754,
    255: 755,
    256: 756,
    257: 757,
    258: 758,
    259: 759,
    260: 760,
    261: 761,
    262: 762,
    263: 763,
    264: 764,
    265: 765,
    266: 766,
    267: 767,
    268: 768,
    269: 769,
    270: 770,
    271: 771,
    272: 772,
    273: 773,
    274: 774,
    275: 775,
    276: 776,
    277: 777,
    278: 778,
    279: 779,
    280: 780,
    281: 781,
    282: 782,
    283: 783,
    284: 784,
    285: 785,
    286: 786,
    287: 787,
    288: 788,
    289: 789,
    290: 790,
    291: 791,
    292: 792,
    293: 793,
    294: 794,
    295: 795,
    296: 796,
    297: 797,
    298: 798,
    299: 799,
    356: 856,
    357: 857,
    358: 858,
    359: 859,
    360: 860,
    361: 861,
    362: 862,
    363: 863,
    364: 864,
    365: 865,
    366: 866,
    367: 867,
    368: 868,
    // ── ACT2 ──
    16384: 500,
    16385: 501,
    16386: 502,
    16387: 503,
    16388: 504,
    16389: 505,
    16390: 506,
    16391: 507,
    16392: 508,
    16393: 509,
    16394: 510,
    16395: 511,
    16396: 512,
    16397: 513,
    16398: 514,
    16399: 515,
    16400: 516,
    16401: 517,
    16402: 518,
    16403: 519,
    16404: 520,
    16405: 521,
    16406: 522,
    16407: 523,
    16408: 524,
    16409: 525,
    16410: 526,
    16411: 527,
    16412: 528,
    16413: 529,
    16414: 530,
    16415: 531,
    16416: 532,
    16417: 533,
    16418: 534,
    16419: 535,
    16420: 536,
    16421: 537,
    16422: 538,
    16423: 539,
    16424: 540,
    16425: 541,
    16426: 542,
    16427: 543,
    16428: 544,
    16429: 545,
    16430: 546,
    16431: 547,
    16432: 548,
    16433: 549,
    16434: 550,
    16435: 551,
    16436: 552,
    16437: 553,
    16438: 554,
    16439: 555,
    16440: 556,
    16441: 557,
    16442: 558,
    16443: 559,
    16444: 560,
    16445: 561,
    16446: 562,
    16447: 563,
    16448: 564,
    16449: 565,
    16450: 566,
    16451: 567,
    16452: 568,
    16453: 569,
    16454: 570,
    16455: 571,
    16456: 572,
    16457: 573,
    16458: 574,
    16459: 575,
    16460: 576,
    16461: 577,
    16462: 578,
    16463: 579,
    16464: 580,
    16465: 581,
    16466: 582,
    // ── ACT3 ──
    32768: 500,
    32769: 501,
    32770: 502,
});

/**
 * Maps animIndex to in-game location ID.
 * Animations not listed here have no fixed location (NPC animations).
 */
const AnimationLocations = Object.freeze({
    // ── ACT1 ──
    0: 1,
    1: 1,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 4,
    7: 4,
    8: 8,
    9: 8,
    10: 8,
    11: 8,
    12: 8,
    13: 8,
    14: 8,
    15: 11,
    16: 11,
    17: 11,
    18: 11,
    19: 11,
    20: 11,
    21: 11,
    22: 14,
    23: 14,
    24: 17,
    25: 18,
    26: 18,
    27: 18,
    28: 18,
    29: 18,
    30: 18,
    31: 18,
    32: 18,
    33: 18,
    34: 18,
    35: 18,
    36: 18,
    37: 18,
    38: 18,
    39: 18,
    40: 18,
    41: 18,
    42: 18,
    43: 23,
    44: 23,
    45: 23,
    46: 23,
    47: 23,
    48: 23,
    49: 23,
    50: 25,
    51: 68,
    52: 68,
    53: 68,
    54: 68,
    55: 68,
    56: 68,
    57: 68,
    58: 27,
    59: 29,
    60: 29,
    61: 31,
    62: 32,
    63: 34,
    64: 35,
    65: 36,
    66: 36,
    67: 38,
    68: 38,
    69: 38,
    70: 38,
    71: 38,
    72: 38,
    73: 38,
    74: 38,
    75: 38,
    76: 38,
    77: 38,
    78: 38,
    79: 38,
    80: 38,
    81: 38,
    82: 38,
    83: 38,
    84: 38,
    85: 38,
    86: 38,
    87: 38,
    88: 38,
    89: 38,
    90: 38,
    91: 38,
    92: 38,
    93: 38,
    94: 38,
    95: 38,
    96: 38,
    97: 38,
    98: 39,
    99: 39,
    100: 40,
    101: 40,
    102: 40,
    103: 42,
    104: 42,
    105: 42,
    106: 42,
    107: 42,
    108: 42,
    109: 46,
    110: 48,
    111: 49,
    112: 51,
    113: 51,
    114: 51,
    115: 51,
    116: 51,
    117: 56,
    118: 56,
    119: 56,
    120: 56,
    121: 57,
    180: 24,
    181: 10,
    182: 52,
    183: 35,
    184: 11,
    185: 11,
    186: 11,
    187: 12,
    188: 34,
    189: 34,
    190: 34,
    191: 34,
    192: 34,
    193: 38,
    194: 38,
    195: 38,
    196: 38,
    197: 38,
    198: 38,
    199: 38,
    200: 38,
    201: 38,
    202: 38,
    203: 38,
    204: 38,
    205: 38,
    206: 38,
    207: 38,
    208: 38,
    209: 65,
    210: 65,
    211: 65,
    212: 34,
    213: 34,
    214: 34,
    215: 39,
    216: 39,
    217: 39,
    218: 39,
    219: 39,
    220: 39,
    221: 40,
    222: 40,
    223: 40,
    224: 8,
    225: 8,
    226: 8,
    227: 38,
    228: 38,
    229: 38,
    230: 38,
    231: 38,
    232: 38,
    233: 38,
    234: 38,
    235: 38,
    236: 38,
    237: 38,
    238: 38,
    239: 51,
    240: 51,
    241: 51,
    242: 11,
    243: 11,
    244: 11,
    245: 38,
    246: 38,
    247: 38,
    248: 38,
    249: 38,
    250: 38,
    251: 38,
    252: 38,
    253: 38,
    254: 11,
    255: 18,
    256: 18,
    257: 18,
    258: 18,
    259: 18,
    260: 18,
    261: 38,
    262: 38,
    263: 38,
    264: 38,
    265: 38,
    266: 38,
    267: 9,
    268: 9,
    269: 9,
    270: 9,
    271: 9,
    272: 9,
    273: 9,
    274: 9,
    275: 9,
    276: 9,
    277: 9,
    278: 9,
    279: 9,
    280: 9,
    281: 9,
    282: 9,
    283: 9,
    284: 9,
    285: 9,
    286: 9,
    287: 55,
    288: 55,
    289: 55,
    290: 55,
    291: 55,
    292: 55,
    293: 43,
    294: 43,
    295: 43,
    296: 43,
    297: 43,
    298: 43,
    299: 43,
    360: 25,
    361: 25,
    362: 25,
    363: 25,
    364: 54,
    365: 54,
    366: 54,
    367: 54,
    368: 56,
    // ── ACT2 ──
    16384: 2,
    16385: 2,
    16386: 8,
    16387: 8,
    16388: 9,
    16389: 9,
    16390: 18,
    16391: 18,
    16392: 18,
    16393: 18,
    16394: 19,
    16395: 19,
    16396: 19,
    16397: 19,
    16398: 23,
    16399: 23,
    16400: 23,
    16401: 24,
    16402: 26,
    16403: 26,
    16404: 26,
    16405: 31,
    16406: 34,
    16407: 36,
    16408: 38,
    16409: 38,
    16410: 39,
    16411: 50,
    16412: 50,
    16413: 51,
    16414: 51,
    16415: 51,
    // ── ACT3 ──
    32768: 22,
    32769: 22,
    32770: 22,
});

/**
 * Maps in-game location IDs to human-readable area labels.
 * Multiple location IDs can map to the same area (different camera angles).
 */
const LocationLabels = Object.freeze({
    1: "Bank",
    2: "Bank",
    3: "Bank",
    4: "Bank",
    8: "Gas Station",
    9: "Gas Station",
    10: "Gas Station",
    11: "Hospital",
    12: "Hospital",
    14: "Hospital",
    17: "Island",
    18: "Jail",
    19: "Jail",
    23: "Beach",
    24: "Beach",
    25: "Beach",
    27: "Island",
    29: "Island",
    31: "Island",
    32: "Island",
    34: "Police Station",
    35: "Police Station",
    36: "Police Station",
    38: "Pizzeria",
    39: "Pizzeria",
    40: "Pizzeria",
    42: "Pizzeria",
    43: "Pizzeria",
    46: "Island",
    48: "Island",
    49: "Island",
    51: "Racetrack",
    52: "Racetrack",
    54: "Racetrack",
    55: "Racetrack",
    56: "Racetrack",
    57: "Island",
    65: "Island",
    68: "Beach",
    22: "Jail",
    26: "Beach",
    50: "Island",
});

/** All animation indices exposed by the feature (cam_anims + npc_anims). */
export const CATALOG_ANIM_INDICES = Object.freeze([
    // ACT1
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
    45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74,
    75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
    90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104,
    105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119,
    120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134,
    135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149,
    150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164,
    165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179,
    180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194,
    195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209,
    210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224,
    225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239,
    240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254,
    255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269,
    270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284,
    285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299,
    356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368,
    // ACT2
    16384, 16385, 16386, 16387, 16388, 16389, 16390, 16391, 16392, 16393, 16394, 16395, 16396, 16397, 16398,
    16399, 16400, 16401, 16402, 16403, 16404, 16405, 16406, 16407, 16408, 16409, 16410, 16411, 16412, 16413,
    16414, 16415, 16416, 16417, 16418, 16419, 16420, 16421, 16422, 16423, 16424, 16425, 16426, 16427, 16428,
    16429, 16430, 16431, 16432, 16433, 16434, 16435, 16436, 16437, 16438, 16439, 16440, 16441, 16442, 16443,
    16444, 16445, 16446, 16447, 16448, 16449, 16450, 16451, 16452, 16453, 16454, 16455, 16456, 16457, 16458,
    16459, 16460, 16461, 16462, 16463, 16464, 16465, 16466,
    // ACT3
    32768, 32769, 32770,
]);

export const TOTAL_ANIMATIONS = CATALOG_ANIM_INDICES.length;

/** Pre-computed map: cluster label → array of animIndices belonging to that cluster. */
export const ClusterAnimIndices = (() => {
    const map = new Map();
    for (const animIndex of CATALOG_ANIM_INDICES) {
        const locId = AnimationLocations[animIndex];
        const label = locId != null ? (LocationLabels[locId] || `Location ${locId}`) : 'Island';
        if (!map.has(label)) map.set(label, []);
        map.get(label).push(animIndex);
    }
    return map;
})();

/**
 * Resolve an array of location IDs (from the backend) to a single cluster label.
 * Returns the label string, or null if no valid locations / multiple clusters.
 */
export function resolveCluster(locations) {
    if (!locations || locations.length === 0) return null;
    const labels = new Set();
    for (const locId of locations) {
        const label = LocationLabels[locId];
        if (label) labels.add(label);
    }
    if (labels.size === 0) return null;
    if (labels.size > 1) {
        console.error('[Cluster] Multiple cluster labels resolved:', [...labels]);
        return null;
    }
    return labels.values().next().value;
}

